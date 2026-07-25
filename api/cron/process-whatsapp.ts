import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { isQuotaExceededError, processWhatsAppOpportunity } from '../utils/whatsappIngestion.js';
import { getRetryTime, updateWhatsAppQueueItem, type WhatsAppQueueItem } from '../utils/whatsappQueue.js';

function sendJson(res: ServerResponse, status: number, body: { success: boolean; error?: string; data?: Record<string, unknown> }) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed. Use GET or POST.' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return sendJson(res, 401, { success: false, error: 'Unauthorized cron trigger request.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
    return sendJson(res, 503, { success: false, error: 'Queue processor configuration is incomplete.' });
  }

  const adminClient = createClient(supabaseUrl, supabaseKey);
  const { data: firstUser, error: profileError } = await adminClient.from('profiles').select('id').limit(1).maybeSingle();
  if (profileError || !firstUser?.id) {
    return sendJson(res, 503, { success: false, error: 'No profile is available for queued opportunity ownership.' });
  }

  const { data: rows, error: queueError } = await adminClient
    .from('whatsapp_ingestion_queue')
    .select('id,idempotency_key,raw_text,payload,user_id,status,attempts,next_attempt_at,last_error,processed_opportunity_id')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(10);

  if (queueError) {
    return sendJson(res, 500, { success: false, error: `Queue lookup failed: ${queueError.message}` });
  }

  let processed = 0;
  let inserted = 0;
  let ignored = 0;
  let deferred = 0;

  for (const row of (rows || []) as WhatsAppQueueItem[]) {
    await updateWhatsAppQueueItem(adminClient, row.id, { status: 'processing' });

    try {
      const result = await processWhatsAppOpportunity({
        adminClient,
        geminiApiKey,
        rawText: row.raw_text,
        systemUserId: row.user_id || firstUser.id
      });

      await updateWhatsAppQueueItem(adminClient, row.id, {
        status: result.status === 'inserted' ? 'completed' : 'ignored',
        processed_opportunity_id: result.status === 'inserted' ? result.opportunityId : null,
        last_error: null
      });

      processed += 1;
      if (result.status === 'inserted') inserted += 1;
      if (result.status === 'ignored') ignored += 1;
    } catch (err: unknown) {
      const quotaExceeded = isQuotaExceededError(err);
      const message = err instanceof Error ? err.message : String(err);
      await updateWhatsAppQueueItem(adminClient, row.id, {
        status: 'pending',
        last_error: message.slice(0, 1000),
        next_attempt_at: getRetryTime(quotaExceeded)
      });
      deferred += 1;
      if (quotaExceeded) break;
    }
  }

  return sendJson(res, 200, {
    success: true,
    data: { processed, inserted, ignored, deferred, remaining: Math.max((rows || []).length - processed, 0) }
  });
}
