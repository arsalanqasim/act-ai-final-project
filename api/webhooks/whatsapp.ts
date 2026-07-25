import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import crypto from 'crypto';
import { normalizeOpportunityUrl, generateOpportunityContentHash } from '../../src/utils/duplicateHash.js';
import { calculateTrustScore } from '../../src/utils/trustScore.js';
import { findApprovedSource } from '../../src/config/approvedSources.js';

function sendJson(res: ServerResponse, status: number, body: { success: boolean; error?: string; data?: Record<string, unknown> }) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

const extractedOpportunitySchema = z.object({
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  category: z.enum(['Hackathon', 'Scholarship', 'Internship', 'Grant', 'Tech Event']),
  deadline: z.string().min(1).max(50),
  location: z.string().min(1).max(100),
  stipendOrPrize: z.string().min(1).max(200),
  techStackOrEligibility: z.array(z.string()).max(30),
  description: z.string().min(1).max(2000),
  applyUrl: z.string().min(1).max(2048)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getBody(req: IncomingMessage): Promise<any> {
  // @ts-expect-error - Next.js/Vercel might inject body
  if (req.body) return req.body;
  
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({ text: data }); // Fallback to raw text
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
  }

  // Authorization check using WHATSAPP_WEBHOOK_SECRET
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || process.env.CRON_SECRET;
  const authHeader = (req.headers.authorization || '').replace('Bearer ', '').trim();
  
  if (!webhookSecret || authHeader !== webhookSecret) {
    return sendJson(res, 401, { success: false, error: 'Unauthorized webhook request.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
    return sendJson(res, 503, { success: false, error: 'Server configuration missing (Database or AI keys).' });
  }

  const payload = await getBody(req);
  
  // Extract text from OpenWA webhook payload or fallback to generic text field
  let rawText = '';
  if (payload?.event === 'onMessage' && payload?.data?.body) {
    rawText = payload.data.body;
  } else if (payload?.text) {
    rawText = payload.text;
  } else if (typeof payload === 'string') {
    rawText = payload;
  } else {
    rawText = JSON.stringify(payload);
  }

  if (!rawText || rawText.trim().length < 20) {
    return sendJson(res, 400, { success: false, error: 'Payload text too short or empty.' });
  }

  const adminClient = createClient(supabaseUrl, supabaseKey);
  const { data: firstUser } = await adminClient.from('profiles').select('id').limit(1).maybeSingle();
  const systemUserId = firstUser?.id;

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const prompt = `You are the WhatsApp Ingestion Agent for OpportunityPulse AI.
Analyze this raw WhatsApp message. Determine if it contains a valid opportunity (Hackathon, Scholarship, Internship, Tech Event, or Grant).
If it DOES NOT contain a clear opportunity with a link to apply, return EXACTLY this JSON: {"isOpportunity": false}

If it DOES contain an opportunity, extract the structured details and return EXACTLY a valid JSON object matching this schema:
{
  "isOpportunity": true,
  "data": {
    "title": "string",
    "organization": "string",
    "category": "Hackathon" | "Scholarship" | "Internship" | "Grant" | "Tech Event",
    "deadline": "YYYY-MM-DD or descriptive deadline",
    "location": "string (e.g. Remote, Pakistan, Global)",
    "stipendOrPrize": "string",
    "techStackOrEligibility": ["string"],
    "description": "string summary",
    "applyUrl": "string (the valid URL to apply/read more)"
  }
}

Do NOT wrap the JSON in markdown blocks (no \`\`\`json).

Raw WhatsApp Message:
${rawText.slice(0, 3000)}`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
    } catch (err: unknown) {
      console.warn(`[AI Engine] Primary model failed, attempting fallback:`, err);
      response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
    }

    const rawResponseText = (response.text || '').replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const jsonValue = JSON.parse(rawResponseText);
    
    if (jsonValue.isOpportunity === false || !jsonValue.data) {
      return sendJson(res, 200, { success: true, data: { status: 'ignored', reason: 'Not recognized as a valid opportunity.' } });
    }

    const parsed = extractedOpportunitySchema.safeParse(jsonValue.data);
    if (!parsed.success) {
      return sendJson(res, 400, { success: false, error: 'AI failed to extract valid schema.', data: parsed.error.format() as unknown as Record<string, unknown> });
    }

    const extractedData = parsed.data;

    // Deduplication check
    const validLink = extractedData.applyUrl;
    const normalizedUrl = normalizeOpportunityUrl(validLink) || validLink;
    const contentHash = generateOpportunityContentHash(extractedData.title, 'WhatsApp Community', validLink);

    const { data: existing } = await adminClient
      .from('custom_opportunities')
      .select('id')
      .or(`normalized_url.eq.${normalizedUrl},content_hash.eq.${contentHash}`)
      .maybeSingle();

    if (existing) {
      return sendJson(res, 200, { success: true, data: { status: 'skipped', reason: 'Opportunity already exists in database.' } });
    }

    // Trust evaluation for WhatsApp community links
    const matchedSource = findApprovedSource(validLink);
    const sourceDomain = matchedSource ? matchedSource.domain : new URL(validLink).hostname.replace(/^www\./, '');
    const trustEvaluation = calculateTrustScore({
      title: extractedData.title,
      organization: extractedData.organization,
      description: extractedData.description,
      techStackOrEligibility: extractedData.techStackOrEligibility,
      sourceUrl: validLink,
      applyUrl: extractedData.applyUrl,
      sourceType: 'user-pasted' // Treat WhatsApp community as user-pasted / tier-3 by default unless domain is official
    });

    const opportunityId = `opp_wa_${crypto.randomUUID()}`;
    const insertPayload: Record<string, unknown> = {
      id: opportunityId,
      title: extractedData.title,
      organization: extractedData.organization,
      category: extractedData.category,
      deadline: extractedData.deadline,
      location: extractedData.location,
      stipend_or_prize: extractedData.stipendOrPrize,
      tech_stack_or_eligibility: extractedData.techStackOrEligibility,
      description: extractedData.description,
      apply_url: extractedData.applyUrl,
      featured: false,
      posted_date: new Date().toISOString().split('T')[0],
      source_url: 'WhatsApp Community',
      normalized_url: normalizedUrl,
      source_domain: sourceDomain,
      source_type: trustEvaluation.sourceType === 'official' ? 'official' : 'tier-3-community',
      trust_tier: trustEvaluation.trustTier,
      trust_score: trustEvaluation.score,
      verification_state: trustEvaluation.verificationState,
      extraction_engine: 'Gemini 2.5 Flash WhatsApp Agent',
      extraction_confidence: 80,
      content_hash: contentHash
    };

    if (systemUserId) {
      insertPayload.user_id = systemUserId;
    }

    const { error: insertErr } = await adminClient
      .from('custom_opportunities')
      .insert(insertPayload);

    if (insertErr) {
      throw new Error(`Database insert failed: ${insertErr.message}`);
    }

    return sendJson(res, 200, {
      success: true,
      data: { status: 'inserted', opportunityId }
    });

  } catch (err: unknown) {
    console.error('[WhatsApp Webhook Error]', err);
    return sendJson(res, 500, { success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
