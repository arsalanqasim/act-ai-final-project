export type OpportunityCategory = 'Hackathon' | 'Scholarship' | 'Internship' | 'Grant' | 'Tech Event';
export type AcademicLevel = 'Undergraduate' | 'Postgraduate' | 'Fresh Graduate' | 'High School';
export type LocationPreference = 'Remote' | 'Pakistan' | 'Global' | 'Hybrid';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  major: string;
  academicLevel: AcademicLevel;
  skills: string[];
  targetCategories: OpportunityCategory[];
  preferredLocation: LocationPreference;
  bio: string;
  emailNotifications: boolean;
  isOnboarded?: boolean;
  createdAt?: string;
}

export interface UserAccount extends UserProfile {
  passwordHash: string; // Stored securely in local user store
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
}

export interface MatchResult {
  opportunityId: string;
  score: number; // 0 to 100
  verdict: 'Excellent Match' | 'Good Match' | 'Moderate Match' | 'Low Compatibility';
  matchingSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

export interface FilterState {
  searchQuery: string;
  category: 'All' | OpportunityCategory;
  minScore: number;
  location: 'All' | LocationPreference;
  sortBy: 'match' | 'deadline' | 'recent';
}

export interface IngestionPayload {
  rawText?: string;
  url?: string;
}
