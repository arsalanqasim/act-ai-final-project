import type { SourceType, TrustTier } from '../config/approvedSources';
import type { VerificationState } from '../utils/trustScore';
import type { DeadlineStatus } from '../utils/dateUtils';

export type { SourceType, TrustTier, VerificationState, DeadlineStatus };

export type OpportunityCategory = 'Hackathon' | 'Scholarship' | 'Internship' | 'Grant' | 'Tech Event';

export type CareerLevel = 
  | 'Undergraduate Student' 
  | 'Postgraduate (MS/PhD)' 
  | 'Fresh Graduate' 
  | 'Experienced Professional' 
  | 'Freelancer / Self-Taught' 
  | 'High School / A-Levels';

export type LocationPreference = 'Remote' | 'Pakistan' | 'Global' | 'Hybrid';

export type EngineMode = 'Secure Server AI Gateway' | 'Local Heuristic Engine';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  major: string; // Major or Current Title (e.g. "Software Engineer", "Data Scientist", "CS Student")
  academicLevel: CareerLevel;
  skills: string[];
  targetCategories: OpportunityCategory[];
  preferredLocation: LocationPreference;
  bio: string;
  emailNotifications: boolean;
  isOnboarded?: boolean;
  createdAt?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  deadline: string; // YYYY-MM-DD or formatted string
  location: string;
  stipendOrPrize: string;
  techStackOrEligibility: string[];
  description: string;
  applyUrl: string;
  featured?: boolean;
  postedDate: string;
  sourceUrl?: string;
  // Phase 2 Provenance & Verification Metadata
  normalizedUrl?: string;
  sourceDomain?: string;
  sourceType?: SourceType;
  trustTier?: TrustTier;
  trustScore?: number;
  verificationState?: VerificationState;
  trustLabel?: string;
  trustReasons?: string[];
  extractionEngine?: EngineMode;
  extractionConfidence?: number;
  contentHash?: string;
}

export interface MatchResult {
  opportunityId: string;
  score: number; // 0 to 100
  verdict: 'Excellent Match' | 'Good Match' | 'Moderate Match' | 'Low Compatibility';
  matchingSkills: string[];
  missingSkills: string[];
  reasons: string[];
  engineMode?: EngineMode;
}

export interface FilterState {
  searchQuery: string;
  category: 'All' | OpportunityCategory;
  minScore: number;
  location: 'All' | LocationPreference;
  sortBy: 'match' | 'deadline' | 'recent';
}

export interface IngestionPayload {
  mode: 'url' | 'text';
  url?: string;
  rawText?: string;
}

export interface IngestionResultData {
  opportunity: Opportunity;
  duplicate?: {
    isDuplicate: boolean;
    existingId?: string;
    message?: string;
  };
}

export interface ExtractedResumeProfile {
  name: string;
  email: string;
  major: string;
  academicLevel: CareerLevel;
  skills: string[];
  targetCategories: OpportunityCategory[];
  preferredLocation: LocationPreference;
  bio: string;
  engineMode?: EngineMode;
}

// Database Row Types (Supabase Postgres mappings)
export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  major: string;
  academic_level: CareerLevel;
  skills: string[];
  target_categories: OpportunityCategory[];
  preferred_location: LocationPreference;
  bio: string;
  email_notifications: boolean;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedOpportunityRow {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
}

export interface CustomOpportunityRow {
  id: string;
  user_id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  deadline: string;
  location: string;
  stipend_or_prize: string;
  tech_stack_or_eligibility: string[];
  description: string;
  apply_url: string;
  featured: boolean;
  posted_date: string;
  source_url: string | null;
  created_at: string;
  // Phase 2 Provenance columns
  normalized_url?: string | null;
  source_domain?: string | null;
  source_type?: SourceType;
  trust_tier?: TrustTier;
  trust_score?: number;
  extraction_engine?: EngineMode;
  extraction_confidence?: number;
  verification_state?: VerificationState;
  source_timestamp?: string | null;
  last_checked_at?: string;
  content_hash?: string | null;
}

// Gateway API Types
export type AiOperation = 'evaluate-match' | 'generate-pitch' | 'ingest-text' | 'extract-resume';

export interface AiGatewayRequest {
  operation: AiOperation;
  profile?: UserProfile;
  opportunity?: Opportunity;
  rawText?: string;
  resumeText?: string;
}

export interface AiGatewayResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  engineMode: EngineMode;
}
