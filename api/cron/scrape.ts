import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';
import { z } from 'zod';
import crypto from 'crypto';
import { normalizeOpportunityUrl, generateOpportunityContentHash } from '../../src/utils/duplicateHash';
import { calculateTrustScore } from '../../src/utils/trustScore';
import { findApprovedSource } from '../../src/config/approvedSources';

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

interface FeedConfig {
  name: string;
  url: string;
  defaultCategory: 'Hackathon' | 'Scholarship' | 'Internship' | 'Grant' | 'Tech Event';
}

const TARGET_FEEDS: FeedConfig[] = [
  {
    name: 'Major League Hacking (MLH)',
    url: 'https://news.mlh.io/feed',
    defaultCategory: 'Hackathon'
  },
  {
    name: 'GitHub Education & Community',
    url: 'https://github.blog/feed/',
    defaultCategory: 'Grant'
  }
];

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed. Use GET or POST.' });
  }

  // Authorization check using CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return sendJson(res, 401, { success: false, error: 'Unauthorized cron trigger request.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return sendJson(res, 503, { success: false, error: 'Database service role key is not configured.' });
  }

  const adminClient = createClient(supabaseUrl, supabaseKey);

  // Get a system user_id to satisfy custom_opportunities foreign key requirement
  const { data: firstUser } = await adminClient.from('profiles').select('id').limit(1).maybeSingle();
  const systemUserId = firstUser?.id;

  const parser = new Parser({
    timeout: 10000,
    requestOptions: {
      rejectUnauthorized: false
    },
    headers: { 'User-Agent': 'OpportunityPulse-AI-Scraper/1.0' }
  });

  let totalProcessed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const feed of TARGET_FEEDS) {
    try {
      const feedData = await parser.parseURL(feed.url);
      const items = (feedData.items || []).slice(0, 5); // Process top 5 recent items per feed

      for (const item of items) {
        totalProcessed++;
        const rawLink = item.link || item.guid || null;
        const title = item.title || 'Untitled Opportunity';
        const rawContent = item.contentSnippet || item.content || item.summary || title;

        if (typeof rawLink !== 'string' || !rawLink.trim()) {
          totalSkipped++;
          continue;
        }

        const validLink: string = rawLink.trim();
        const normalizedUrl: string = normalizeOpportunityUrl(validLink) || validLink;
        const contentHash: string = generateOpportunityContentHash(title, feed.name, validLink);

        // Check if opportunity already exists in database by normalizedUrl or contentHash
        const { data: existing } = await adminClient
          .from('custom_opportunities')
          .select('id')
          .or(`normalized_url.eq.${normalizedUrl},content_hash.eq.${contentHash}`)
          .maybeSingle();

        if (existing) {
          totalSkipped++;
          continue;
        }

        // If Gemini API key is available, attempt AI structured extraction
        let extractedData: z.infer<typeof extractedOpportunitySchema> | null = null;
        let extractionEngine = 'Local Feed Extractor';

        if (geminiApiKey) {
          try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const prompt = `You are the Ingestion Agent for OpportunityPulse AI.
Extract structured JSON from this feed item:
Title: ${title}
URL: ${validLink}
Content: ${rawContent.slice(0, 3000)}

Return ONLY a single valid JSON object with fields:
- title: string
- organization: string
- category: one of ["Hackathon", "Scholarship", "Internship", "Grant", "Tech Event"]
- deadline: YYYY-MM-DD or descriptive deadline
- location: e.g. "Remote", "Global", "Pakistan"
- stipendOrPrize: string
- techStackOrEligibility: array of strings
- description: string summary
- applyUrl: valid URL`;

            // Add 1-second delay between item requests to stay under 15 RPM free tier limit
            await new Promise(r => setTimeout(r, 1000));

            let response;
            try {
              response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
              });
            } catch {
              // Automatic secondary fallback to gemini-flash-lite-latest
              response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
              });
            }

            const rawText = response.text || '';
            const jsonValue = JSON.parse(rawText);
            const parsed = extractedOpportunitySchema.safeParse(jsonValue);
            if (parsed.success) {
              extractedData = parsed.data;
              extractionEngine = 'Gemini 1.5 Flash Feed Agent';
            }
          } catch (aiErr: unknown) {
            const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
            if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
              console.warn(`[AI Engine Rate Limit] Quota limit reached for item "${title}". Switching to local heuristic fallback.`);
            } else {
              console.warn(`[AI Engine Warning] Fallback for item "${title}":`, msg.slice(0, 150));
            }
          }
        }

        // Fallback to local heuristic extraction if AI is unavailable or failed
        if (!extractedData) {
          extractedData = {
            title: title.slice(0, 200),
            organization: feed.name,
            category: feed.defaultCategory,
            deadline: 'See Source Link',
            location: 'Remote',
            stipendOrPrize: 'Check Listing',
            techStackOrEligibility: ['General Tech', 'Students & Youth'],
            description: rawContent.slice(0, 500),
            applyUrl: validLink
          };
        }

        // Calculate trust score & provenance
        const matchedSource = findApprovedSource(validLink);
        const sourceDomain = matchedSource ? matchedSource.domain : new URL(validLink).hostname.replace(/^www\./, '');
        const trustEvaluation = calculateTrustScore({
          title: extractedData.title,
          organization: extractedData.organization,
          description: extractedData.description,
          techStackOrEligibility: extractedData.techStackOrEligibility,
          sourceUrl: validLink,
          applyUrl: extractedData.applyUrl,
          sourceType: 'official'
        });

        const opportunityId = `opp_scrape_${crypto.randomUUID()}`;

        // Insert payload
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
          source_url: validLink,
          normalized_url: normalizedUrl,
          source_domain: sourceDomain,
          source_type: trustEvaluation.sourceType,
          trust_tier: trustEvaluation.trustTier,
          trust_score: trustEvaluation.score,
          verification_state: trustEvaluation.verificationState,
          extraction_engine: extractionEngine,
          extraction_confidence: 85,
          content_hash: contentHash
        };

        if (systemUserId) {
          insertPayload.user_id = systemUserId;
        }

        // Insert into Supabase
        const { error: insertErr } = await adminClient
          .from('custom_opportunities')
          .insert(insertPayload);

        if (!insertErr) {
          totalInserted++;
        } else {
          console.warn(`[Supabase Insert Warning] Could not insert item "${title}":`, insertErr.message);
        }
      }
    } catch (feedErr) {
      console.warn(`Failed to process RSS feed ${feed.name}:`, feedErr instanceof Error ? feedErr.message : feedErr);
    }
  }

  return sendJson(res, 200, {
    success: true,
    data: {
      processed: totalProcessed,
      inserted: totalInserted,
      skipped: totalSkipped
    }
  });
}
