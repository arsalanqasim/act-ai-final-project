import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { isQuotaExceededError, isLikelyOpportunityText, processWhatsAppOpportunity } from '../utils/whatsappIngestion.js';
import { claimWhatsAppQueueItem, getRetryTime, updateWhatsAppQueueItem } from '../utils/whatsappQueue.js';

type JsonRecord = Record<string, unknown>;

type WebhookRequest = IncomingMessage & {
  body?: unknown;
  rawBody?: Buffer | string;
};

function sendJson(res: ServerResponse, status: number, body: { success: boolean; error?: string; data?: Record<string, unknown> }) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export const config = {
  api: {
    bodyParser: false
  }
};

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function getRawBody(req: WebhookRequest): Promise<Buffer> {
  if (req.rawBody !== undefined) {
    return Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody);
  }

  if (req.body !== undefined) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    return Buffer.from(JSON.stringify(req.body));
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseBody(rawBody: Buffer): unknown {
  const text = rawBody.toString('utf8');
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { text };
  }
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function hasValidOpenWASignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function getTextAt(payload: unknown, ...path: string[]): string | undefined {
  let current: unknown = payload;
  for (const key of path) {
    if (!isJsonRecord(current)) return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function extractMessageText(payload: unknown): string {
  const candidates = [
    getTextAt(payload, 'data', 'body'),
    getTextAt(payload, 'payload', 'message', 'body'),
    getTextAt(payload, 'text'),
    getTextAt(payload, 'message', 'body'),
    getTextAt(payload, 'entry', '0', 'changes', '0', 'value', 'messages', '0', 'text', 'body')
  ];

  const firstText = candidates.find((candidate): candidate is string => Boolean(candidate?.trim()));
  if (firstText) return firstText;
  return typeof payload === 'string' ? payload : '';
}

export default async function handler(req: WebhookRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
  }

  const rawBody = await getRawBody(req);
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || process.env.OPENWA_WEBHOOK_SECRET || process.env.CRON_SECRET;
  const allowUnsignedOpenWA = process.env.ALLOW_UNSIGNED_OPENWA_WEBHOOKS === 'true';
  const authHeader = getHeader(req, 'authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  const signature = getHeader(req, 'x-openwa-signature');
  const hasValidBearer = Boolean(webhookSecret && bearerToken === webhookSecret);
  const hasValidSignature = Boolean(webhookSecret && hasValidOpenWASignature(rawBody, signature, webhookSecret));

  if (!webhookSecret && !allowUnsignedOpenWA) {
    return sendJson(res, 503, { success: false, error: 'Webhook secret is not configured on the server.' });
  }

  // Never accept a supplied but invalid signature. Unsigned requests are only
  // allowed when explicitly enabled for dashboard-created OpenWA webhooks.
  if ((signature && !hasValidSignature && !hasValidBearer) || (!signature && !hasValidBearer && !allowUnsignedOpenWA)) {
    return sendJson(res, 401, { success: false, error: 'Unauthorized webhook request.' });
  }

  const payload = parseBody(rawBody);

  if (getTextAt(payload, 'event') === 'test') {
    return sendJson(res, 200, { success: true, data: { status: 'accepted', reason: 'OpenWA test delivery received.' } });
  }

  const rawText = extractMessageText(payload);

  if (!rawText || rawText.trim().length < 20) {
    return sendJson(res, 200, { success: true, data: { status: 'ignored', reason: 'No opportunity text found in webhook event.' } });
  }

  if (!isLikelyOpportunityText(rawText)) {
    return sendJson(res, 200, { success: true, data: { status: 'ignored', reason: 'Message did not pass the local opportunity filter.' } });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return sendJson(res, 503, { success: false, error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.' });
  }

  if (!geminiApiKey) {
    return sendJson(res, 503, { success: false, error: 'GEMINI_API_KEY is not configured.' });
  }

  const adminClient = createClient(supabaseUrl, supabaseKey);
  const { data: firstUser } = await adminClient.from('profiles').select('id').limit(1).maybeSingle();
  const systemUserId = firstUser?.id;
  if (!systemUserId) {
    return sendJson(res, 503, { success: false, error: 'No profile is available for WhatsApp opportunity ownership.' });
  }

  const openWAIdempotencyKey = getHeader(req, 'x-openwa-idempotency-key');
  const idempotencyKey = openWAIdempotencyKey || crypto.createHash('sha256').update(`openwa:${rawText.trim()}`).digest('hex');

  try {
    const queueClaim = await claimWhatsAppQueueItem({
      adminClient,
      idempotencyKey,
      rawText,
      payload,
      userId: systemUserId
    });

    if (!queueClaim.created) {
      const existingStatus = queueClaim.item.status;
      return sendJson(res, 200, {
        success: true,
        data: {
          status: existingStatus === 'completed' ? 'skipped' : 'queued',
          reason: existingStatus === 'completed'
            ? 'OpenWA delivery was already processed.'
            : 'OpenWA delivery is already being processed or queued.'
        }
      });
    }

    try {
      const result = await processWhatsAppOpportunity({
        adminClient,
        geminiApiKey,
        rawText,
        systemUserId
      });

      await updateWhatsAppQueueItem(adminClient, queueClaim.item.id, {
        status: result.status === 'inserted' ? 'completed' : 'ignored',
        processed_opportunity_id: result.status === 'inserted' ? result.opportunityId : null,
        last_error: null
      });

      return sendJson(res, 200, { success: true, data: result });
    } catch (err: unknown) {
      const quotaExceeded = isQuotaExceededError(err);
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Engine] WhatsApp message queued after ${quotaExceeded ? 'quota exhaustion' : 'processing failure'}.`, err);
      await updateWhatsAppQueueItem(adminClient, queueClaim.item.id, {
        status: 'pending',
        last_error: message.slice(0, 1000),
        next_attempt_at: getRetryTime(quotaExceeded)
      });

      return sendJson(res, 200, {
        success: true,
        data: {
          status: 'queued',
          reason: quotaExceeded
            ? 'Gemini quota is exhausted; the message will be retried after the quota window.'
            : 'Message processing failed temporarily; the message was queued for retry.'
        }
      });
    }

  } catch (err: unknown) {
    console.error('[WhatsApp Webhook Error]', err);
    return sendJson(res, 500, { success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
