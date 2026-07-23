import { Opportunity, OpportunityCategory } from '../../types';
export interface PipelineItem { category: OpportunityCategory; count: number; savedCount: number; percentage: number; }
export interface PrioritizedOpportunity { opportunity: Opportunity; matchScore: number; priorityScore: number; daysRemaining: number | null; reasons: string[]; }
export type NextActionType = 'urgent_apply' | 'review_saved' | 'high_match_save' | 'profile_enhancement' | 'pipeline_ingest';
export interface NextBestAction { id: string; type: NextActionType; title: string; description: string; why: string; actionLabel: string; opportunityId?: string; }
export interface DecisionInsights { pipeline: PipelineItem[]; urgency: { overdue: number; closingSoon: number; upcoming: number; savedClosingSoon: number }; matchDistribution: { highFit: number; goodFit: number; moderateFit: number; lowFit: number; avgScore: number }; trustDistribution: { official: number; approved: number; community: number; needsReview: number }; conversion: { totalOpportunities: number; savedCount: number; conversionRate: number }; highPriorityQueue: PrioritizedOpportunity[]; nextBestActions: NextBestAction[]; }
