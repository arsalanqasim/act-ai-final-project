-- OpportunityPulse AI - Phase 4 Migration: Career Action Tasks

-- 1. ACTION TASKS TABLE
CREATE TABLE IF NOT EXISTS public.action_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  opportunity_id TEXT,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  description TEXT NOT NULL DEFAULT '',
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_action_tasks_user_id
  ON public.action_tasks (user_id);

CREATE INDEX IF NOT EXISTS idx_action_tasks_user_completed
  ON public.action_tasks (user_id, completed);

CREATE INDEX IF NOT EXISTS idx_action_tasks_due_at
  ON public.action_tasks (user_id, due_at)
  WHERE due_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_action_tasks_application_id
  ON public.action_tasks (application_id)
  WHERE application_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.action_tasks ENABLE ROW LEVEL SECURITY;

-- Strict RLS policies: users can only access their own tasks
CREATE POLICY "Users can select own action tasks"
  ON public.action_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own action tasks"
  ON public.action_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own action tasks"
  ON public.action_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own action tasks"
  ON public.action_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 2. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_action_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Auto-set completed_at when task is marked complete
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();
  END IF;
  -- Clear completed_at when task is reopened
  IF NEW.completed = FALSE AND OLD.completed = TRUE THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_action_tasks_updated ON public.action_tasks;
CREATE TRIGGER on_action_tasks_updated
  BEFORE UPDATE ON public.action_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_action_tasks_updated_at();
