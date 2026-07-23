-- OpportunityPulse AI - Phase 2 Migration: Trusted Opportunity Ingestion & Source Provenance

-- 1. EXTEND CUSTOM OPPORTUNITIES TABLE WITH PROVENANCE FIELDS
ALTER TABLE public.custom_opportunities
  ADD COLUMN IF NOT EXISTS normalized_url TEXT,
  ADD COLUMN IF NOT EXISTS source_domain TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('official', 'approved-platform', 'community-submitted', 'user-pasted')) DEFAULT 'user-pasted',
  ADD COLUMN IF NOT EXISTS trust_tier TEXT DEFAULT 'tier-3-community',
  ADD COLUMN IF NOT EXISTS trust_score INTEGER CHECK (trust_score BETWEEN 0 AND 100) DEFAULT 50,
  ADD COLUMN IF NOT EXISTS extraction_engine TEXT DEFAULT 'Local Heuristic Engine',
  ADD COLUMN IF NOT EXISTS extraction_confidence INTEGER CHECK (extraction_confidence BETWEEN 0 AND 100) DEFAULT 70,
  ADD COLUMN IF NOT EXISTS verification_state TEXT CHECK (verification_state IN ('unverified', 'source-confirmed', 'needs-review', 'expired')) DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS source_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 2. CREATE UNIQUE INDEX FOR DUPLICATE PREVENTION PER USER (NORMALIZED URL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_opps_user_normalized_url
  ON public.custom_opportunities(user_id, normalized_url)
  WHERE normalized_url IS NOT NULL AND normalized_url <> '';

-- 3. ENFORCE CONTENT-BASED DUPLICATE PREVENTION PER USER
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_opps_user_content_hash
  ON public.custom_opportunities(user_id, content_hash)
  WHERE content_hash IS NOT NULL AND content_hash <> '';

-- 4. ENSURE ROW LEVEL SECURITY POLICIES REMAIN ENFORCED
ALTER TABLE public.custom_opportunities ENABLE ROW LEVEL SECURITY;

-- Note: Existing RLS policies from Phase 1 remain active:
-- Users can SELECT, INSERT, UPDATE, DELETE only their own custom opportunities (auth.uid() = user_id).
