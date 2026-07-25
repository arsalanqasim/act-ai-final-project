-- Durable WhatsApp ingestion queue for quota-aware AI processing and idempotency.
CREATE TABLE IF NOT EXISTS public.whatsapp_ingestion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  raw_text TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'ignored', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  processed_opportunity_id TEXT REFERENCES public.custom_opportunities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_ingestion_queue_ready_idx
  ON public.whatsapp_ingestion_queue (status, next_attempt_at);

CREATE INDEX IF NOT EXISTS whatsapp_ingestion_queue_created_idx
  ON public.whatsapp_ingestion_queue (created_at DESC);

ALTER TABLE public.whatsapp_ingestion_queue ENABLE ROW LEVEL SECURITY;

-- The webhook and queue cron use the server-side Supabase service role.
-- Explicit grants are required when this table is created through a custom
-- migration rather than the Supabase dashboard table editor.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.whatsapp_ingestion_queue TO service_role;

CREATE OR REPLACE FUNCTION public.update_whatsapp_ingestion_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS whatsapp_ingestion_queue_updated_at ON public.whatsapp_ingestion_queue;
CREATE TRIGGER whatsapp_ingestion_queue_updated_at
  BEFORE UPDATE ON public.whatsapp_ingestion_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_ingestion_queue_updated_at();
