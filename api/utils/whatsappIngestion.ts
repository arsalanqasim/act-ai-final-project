import { GoogleGenAI } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';
import { normalizeOpportunityUrl, generateOpportunityContentHash } from '../../src/utils/duplicateHash.js';
import { calculateTrustScore } from '../../src/utils/trustScore.js';
import { findApprovedSource } from '../../src/config/approvedSources.js';

export const extractedOpportunitySchema = z.object({
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

type OpportunityData = z.infer<typeof extractedOpportunitySchema>;

export type WhatsAppProcessResult =
  | { status: 'inserted'; opportunityId: string }
  | { status: 'skipped'; reason: string }
  | { status: 'ignored'; reason: string };

const OPPORTUNITY_SIGNAL_PATTERN = /\b(hackathon|scholarship|internship|fellowship|grant|residency|bootcamp|competition|challenge|deadline|apply|funding|prize|call for applications?)\b/i;
const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;

export function isLikelyOpportunityText(rawText: string): boolean {
  const text = rawText.trim();
  return text.length >= 20 && OPPORTUNITY_SIGNAL_PATTERN.test(text) && URL_PATTERN.test(text);
}

export function isQuotaExceededError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const candidate = error as { status?: unknown; message?: unknown; error?: { code?: unknown; status?: unknown } };
  const status = candidate.status ?? candidate.error?.code;
  const nestedStatus = candidate.error?.status;
  const message = typeof candidate.message === 'string' ? candidate.message : '';

  return status === 429 || nestedStatus === 'RESOURCE_EXHAUSTED' || /RESOURCE_EXHAUSTED|quota exceeded|status.?429/i.test(message);
}

function buildPrompt(rawText: string): string {
  return `You are the WhatsApp Ingestion Agent for OpportunityPulse AI.
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

Do NOT wrap the JSON in markdown blocks.

Raw WhatsApp Message:
${rawText.slice(0, 3000)}`;
}

async function extractOpportunity(rawText: string, geminiApiKey: string): Promise<OpportunityData | null> {
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: buildPrompt(rawText),
    config: { responseMimeType: 'application/json' }
  });

  const rawResponseText = (response.text || '').replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  const jsonValue = JSON.parse(rawResponseText) as { isOpportunity?: boolean; data?: unknown };

  if (jsonValue.isOpportunity === false || !jsonValue.data) return null;

  const parsed = extractedOpportunitySchema.safeParse(jsonValue.data);
  if (!parsed.success) {
    throw new Error('AI failed to extract a valid opportunity schema.');
  }

  return parsed.data;
}

export async function processWhatsAppOpportunity({
  adminClient,
  geminiApiKey,
  rawText,
  systemUserId
}: {
  adminClient: SupabaseClient;
  geminiApiKey: string;
  rawText: string;
  systemUserId: string;
}): Promise<WhatsAppProcessResult> {
  if (!isLikelyOpportunityText(rawText)) {
    return { status: 'ignored', reason: 'Message did not pass the local opportunity filter.' };
  }

  const extractedData = await extractOpportunity(rawText, geminiApiKey);
  if (!extractedData) {
    return { status: 'ignored', reason: 'Not recognized as a valid opportunity.' };
  }

  const validLink = extractedData.applyUrl;
  const normalizedUrl = normalizeOpportunityUrl(validLink) || validLink;
  const contentHash = generateOpportunityContentHash(extractedData.title, 'WhatsApp Community', validLink);

  const { data: existingByHash, error: hashLookupError } = await adminClient
    .from('custom_opportunities')
    .select('id')
    .eq('content_hash', contentHash)
    .limit(1)
    .maybeSingle();

  if (hashLookupError) throw new Error(`Database duplicate check failed: ${hashLookupError.message}`);
  if (existingByHash) {
    return { status: 'skipped', reason: 'Opportunity already exists in database.' };
  }

  const { data: existingByUrl, error: urlLookupError } = await adminClient
    .from('custom_opportunities')
    .select('id')
    .eq('normalized_url', normalizedUrl)
    .limit(1)
    .maybeSingle();

  if (urlLookupError) throw new Error(`Database duplicate check failed: ${urlLookupError.message}`);
  if (existingByUrl) {
    return { status: 'skipped', reason: 'Opportunity already exists in database.' };
  }

  const matchedSource = findApprovedSource(validLink);
  let sourceDomain = matchedSource?.domain || 'unknown';
  try {
    sourceDomain = new URL(validLink).hostname.replace(/^www\./, '');
  } catch {
    // Trust scoring still handles malformed URLs; schema validation keeps the value bounded.
  }

  const trustEvaluation = calculateTrustScore({
    title: extractedData.title,
    organization: extractedData.organization,
    description: extractedData.description,
    techStackOrEligibility: extractedData.techStackOrEligibility,
    sourceUrl: validLink,
    applyUrl: extractedData.applyUrl,
    sourceType: 'user-pasted'
  });

  const opportunityId = `opp_wa_${crypto.randomUUID()}`;
  const { error: insertError } = await adminClient.from('custom_opportunities').insert({
    id: opportunityId,
    user_id: systemUserId,
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
    source_type: trustEvaluation.sourceType,
    trust_tier: trustEvaluation.trustTier,
    trust_score: trustEvaluation.score,
    verification_state: trustEvaluation.verificationState,
    extraction_engine: 'Gemini 2.5 Flash-Lite WhatsApp Agent',
    extraction_confidence: 80,
    content_hash: contentHash
  });

  if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);
  return { status: 'inserted', opportunityId };
}
