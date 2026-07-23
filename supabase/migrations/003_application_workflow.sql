-- OpportunityPulse AI - Phase 3A Migration: Application Workflow & Row Level Security (RLS) Schema

-- 1. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL,
  opportunity_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (
    status IN ('saved', 'researching', 'drafting', 'ready_to_submit', 'submitted', 'interview', 'offer', 'rejected', 'archived')
  ),
  notes TEXT NOT NULL DEFAULT '',
  next_action TEXT NOT NULL DEFAULT '',
  next_action_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_opportunity_application UNIQUE (user_id, opportunity_id)
);

-- 2. INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_user_opp ON public.applications(user_id, opportunity_id);

-- 3. SAFE AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_applications_updated_at ON public.applications;
CREATE TRIGGER trigger_update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_applications_updated_at();

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 5. ROW LEVEL SECURITY POLICIES (Strictly enforcing auth.uid() = user_id)
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON public.applications FOR DELETE
  USING (auth.uid() = user_id);
