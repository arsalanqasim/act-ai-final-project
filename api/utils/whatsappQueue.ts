import type { SupabaseClient } from '@supabase/supabase-js';

export interface WhatsAppQueueItem {
  id: string;
  idempotency_key: string;
  raw_text: string;
  payload: unknown;
  user_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'ignored' | 'failed';
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  processed_opportunity_id: string | null;
}

const QUEUE_COLUMNS = 'id,idempotency_key,raw_text,payload,user_id,status,attempts,next_attempt_at,last_error,processed_opportunity_id';

export async function claimWhatsAppQueueItem({
  adminClient,
  idempotencyKey,
  rawText,
  payload,
  userId
}: {
  adminClient: SupabaseClient;
  idempotencyKey: string;
  rawText: string;
  payload: unknown;
  userId: string | null;
}): Promise<{ item: WhatsAppQueueItem; created: boolean }> {
  const { data: inserted, error: insertError } = await adminClient
    .from('whatsapp_ingestion_queue')
    .insert({
      idempotency_key: idempotencyKey,
      raw_text: rawText,
      payload,
      user_id: userId,
      status: 'processing',
      attempts: 1
    })
    .select(QUEUE_COLUMNS)
    .maybeSingle();

  if (!insertError && inserted) {
    return { item: inserted as WhatsAppQueueItem, created: true };
  }

  if (insertError?.code !== '23505') {
    throw new Error(`Queue insert failed: ${insertError?.message || 'No queue row returned.'}`);
  }

  const { data: existing, error: lookupError } = await adminClient
    .from('whatsapp_ingestion_queue')
    .select(QUEUE_COLUMNS)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (lookupError || !existing) {
    throw new Error(`Queue idempotency lookup failed: ${lookupError?.message || 'Row not found.'}`);
  }

  return { item: existing as WhatsAppQueueItem, created: false };
}

export async function updateWhatsAppQueueItem(
  adminClient: SupabaseClient,
  id: string,
  values: {
    status: WhatsAppQueueItem['status'];
    last_error?: string | null;
    processed_opportunity_id?: string | null;
    next_attempt_at?: string;
  }
): Promise<void> {
  const { error } = await adminClient
    .from('whatsapp_ingestion_queue')
    .update(values)
    .eq('id', id);

  if (error) throw new Error(`Queue update failed: ${error.message}`);
}

export function getRetryTime(isQuotaError: boolean): string {
  const delayMs = isQuotaError ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
  return new Date(Date.now() + delayMs).toISOString();
}
