-- OpportunityPulse AI - Phase 1 Migration: Core Database & Row Level Security (RLS) Schema

-- 1. PROFILES TABLE (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  major TEXT NOT NULL DEFAULT '',
  academic_level TEXT NOT NULL DEFAULT 'Undergraduate Student',
  skills TEXT[] NOT NULL DEFAULT '{}',
  target_categories TEXT[] NOT NULL DEFAULT '{}',
  preferred_location TEXT NOT NULL DEFAULT 'Remote',
  bio TEXT NOT NULL DEFAULT '',
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- 2. SAVED OPPORTUNITIES TABLE (User Bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_saved_opportunity UNIQUE (user_id, opportunity_id)
);

-- Index for fast user bookmark lookups
CREATE INDEX IF NOT EXISTS idx_saved_opps_user_id ON public.saved_opportunities(user_id);

-- Enable Row Level Security
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;

-- Saved Opportunities RLS Policies
CREATE POLICY "Users can view own saved opportunities"
  ON public.saved_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save opportunities"
  ON public.saved_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved opportunities"
  ON public.saved_opportunities FOR DELETE
  USING (auth.uid() = user_id);


-- 3. CUSTOM OPPORTUNITIES TABLE (User-Ingested Opportunities)
CREATE TABLE IF NOT EXISTS public.custom_opportunities (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  category TEXT NOT NULL,
  deadline TEXT NOT NULL,
  location TEXT NOT NULL,
  stipend_or_prize TEXT NOT NULL,
  tech_stack_or_eligibility TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  apply_url TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  posted_date TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user custom opportunity queries
CREATE INDEX IF NOT EXISTS idx_custom_opps_user_id ON public.custom_opportunities(user_id);

-- Enable Row Level Security
ALTER TABLE public.custom_opportunities ENABLE ROW LEVEL SECURITY;

-- Custom Opportunities RLS Policies
CREATE POLICY "Users can view own custom opportunities"
  ON public.custom_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom opportunities"
  ON public.custom_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom opportunities"
  ON public.custom_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom opportunities"
  ON public.custom_opportunities FOR DELETE
  USING (auth.uid() = user_id);


-- 4. AUTOMATIC NEW USER PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
