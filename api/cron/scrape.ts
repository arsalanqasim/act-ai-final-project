import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';
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
  applyUrl: z.string().min(1).max(2048),
  sourceUrl: z.string().min(1) // added to map back to original feed
});

const batchOpportunitySchema = z.array(extractedOpportunitySchema);

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
  },
  {
    name: 'Devpost Hackathons',
    url: 'https://devpost.com/hackathons.rss',
    defaultCategory: 'Hackathon'
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
    headers: { 'User-Agent': 'OpportunityPulse-AI-Scraper/2.0' }
  });

  let totalProcessed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  // 1. Gather and pre-filter all items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newItemsToProcess: any[] = [];

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

        // Check if opportunity already exists in database
        const { data: existing } = await adminClient
          .from('custom_opportunities')
          .select('id')
          .or(`normalized_url.eq.${normalizedUrl},content_hash.eq.${contentHash}`)
          .maybeSingle();

        if (existing) {
          totalSkipped++;
          continue;
        }

        newItemsToProcess.push({
          feedName: feed.name,
          defaultCategory: feed.defaultCategory,
          title,
          validLink,
          normalizedUrl,
          contentHash,
          rawContent: rawContent.slice(0, 2000)
        });
      }
    } catch (feedErr) {
      console.warn(`Failed to process RSS feed ${feed.name}:`, feedErr instanceof Error ? feedErr.message : feedErr);
    }
  }

  if (newItemsToProcess.length === 0) {
    return sendJson(res, 200, {
      success: true,
      data: { processed: totalProcessed, inserted: 0, skipped: totalSkipped, message: 'No new items to process.' }
    });
  }

  // 2. Batch AI Semantic Deduplication & Extraction
  let extractedOpportunities: z.infer<typeof batchOpportunitySchema> = [];
  let extractionEngine = 'Local Feed Extractor (Fallback)';

  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      
      const payloadString = newItemsToProcess.map((item, idx) => `
--- ITEM ${idx + 1} ---
Source Feed: ${item.feedName}
Title: ${item.title}
URL: ${item.validLink}
Content: ${item.rawContent}
      `).join('\n');

      const prompt = `You are the Ingestion & Deduplication Agent for OpportunityPulse AI.
I am providing you with a list of recently scraped items from various RSS feeds.
Your job is to:
1. Analyze all items and group semantic duplicates (e.g., if two items from different sources describe the exact same hackathon or scholarship, merge them into one output item).
2. Extract the structured details for each unique opportunity.
3. Return ONLY a single, valid JSON array containing the unique objects. Do NOT wrap the JSON in markdown blocks (no \`\`\`json).

Output Array Item Schema:
- title: string
- organization: string
- category: one of ["Hackathon", "Scholarship", "Internship", "Grant", "Tech Event"]
- deadline: string (YYYY-MM-DD or a descriptive deadline)
- location: string (e.g. "Remote", "Global", "Pakistan", "New York")
- stipendOrPrize: string
- techStackOrEligibility: array of strings
- description: string summary
- applyUrl: string (the valid URL to apply/read more)
- sourceUrl: string (the original URL of the feed item you used to extract this)

Scraped Items:
${payloadString}`;

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

      const rawText = (response.text || '').replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      const jsonValue = JSON.parse(rawText);
      const parsed = batchOpportunitySchema.safeParse(jsonValue);
      
      if (parsed.success) {
        extractedOpportunities = parsed.data;
        extractionEngine = 'Gemini 2.5 Flash Batch Agent';
      } else {
        console.warn('[AI Engine] Failed to parse output into schema:', parsed.error);
      }
    } catch (aiErr: unknown) {
      console.warn(`[AI Engine Warning] Batch extraction failed:`, aiErr instanceof Error ? aiErr.message : String(aiErr));
    }
  }

  // 3. Fallback Mapping (if AI completely fails)
  if (extractedOpportunities.length === 0) {
    extractedOpportunities = newItemsToProcess.map(item => ({
      title: item.title.slice(0, 200),
      organization: item.feedName,
      category: item.defaultCategory,
      deadline: 'See Source Link',
      location: 'Remote',
      stipendOrPrize: 'Check Listing',
      techStackOrEligibility: ['General Tech', 'Students & Youth'],
      description: item.rawContent.slice(0, 500),
      applyUrl: item.validLink,
      sourceUrl: item.validLink
    }));
  }

  // 4. Insert into Supabase
  for (const extractedData of extractedOpportunities) {
    // Find the original raw item to get normalizedUrl and contentHash
    const originalItem = newItemsToProcess.find(item => item.validLink === extractedData.sourceUrl) 
                      || newItemsToProcess[0];

    const matchedSource = findApprovedSource(originalItem.validLink);
    const sourceDomain = matchedSource ? matchedSource.domain : new URL(originalItem.validLink).hostname.replace(/^www\./, '');
    
    const trustEvaluation = calculateTrustScore({
      title: extractedData.title,
      organization: extractedData.organization,
      description: extractedData.description,
      techStackOrEligibility: extractedData.techStackOrEligibility,
      sourceUrl: originalItem.validLink,
      applyUrl: extractedData.applyUrl,
      sourceType: 'official'
    });

    const opportunityId = `opp_scrape_${crypto.randomUUID()}`;

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
      source_url: originalItem.validLink,
      normalized_url: originalItem.normalizedUrl,
      source_domain: sourceDomain,
      source_type: trustEvaluation.sourceType,
      trust_tier: trustEvaluation.trustTier,
      trust_score: trustEvaluation.score,
      verification_state: trustEvaluation.verificationState,
      extraction_engine: extractionEngine,
      extraction_confidence: 85,
      content_hash: originalItem.contentHash
    };

    if (systemUserId) {
      insertPayload.user_id = systemUserId;
    }

    const { error: insertErr } = await adminClient
      .from('custom_opportunities')
      .insert(insertPayload);

    if (!insertErr) {
      totalInserted++;
    } else {
      console.warn(`[Supabase Insert Warning] Could not insert item "${extractedData.title}":`, insertErr.message);
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
