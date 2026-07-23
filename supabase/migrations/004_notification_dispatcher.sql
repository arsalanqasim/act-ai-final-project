-- OpportunityPulse AI - Phase 3B Migration: Notification Dispatcher & Outbox Schema

-- 1. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  frequency TEXT NOT NULL CHECK (frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'daily',
  minimum_match_score INTEGER NOT NULL CHECK (minimum_match_score BETWEEN 0 AND 100) DEFAULT 70,
  categories TEXT[] NOT NULL DEFAULT '{}',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  digest_hour INTEGER NOT NULL CHECK (digest_hour BETWEEN 0 AND 23) DEFAULT 9,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notification Preferences RLS Policies
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);


-- 2. NOTIFICATION DELIVERIES TABLE (Outbox for Audit & Idempotency)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL,
  application_id TEXT,
  delivery_window TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'suppressed')) DEFAULT 'queued',
  provider_message_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Unique index to strictly enforce idempotency per user, opportunity, and delivery window
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_deliveries_idempotency
  ON public.notification_deliveries (user_id, opportunity_id, delivery_window);

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_id
  ON public.notification_deliveries (user_id);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status
  ON public.notification_deliveries (status);

-- Enable Row Level Security
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Notification Deliveries RLS Policies
CREATE POLICY "Users can view own notification deliveries"
  ON public.notification_deliveries FOR SELECT
  USING (auth.uid() = user_id);


-- 3. AUTOMATIC UPDATED_AT TRIGGER FOR PREFERENCES
CREATE OR REPLACE FUNCTION public.handle_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_preferences_updated ON public.notification_preferences;
CREATE TRIGGER on_notification_preferences_updated
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_notification_preferences_updated_at();
