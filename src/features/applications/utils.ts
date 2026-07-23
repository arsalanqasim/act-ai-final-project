import { ApplicationStatus, ChecklistItem, ApplicationRecord } from '../../types';
import { StatusConfig } from './types';
import { getDeadlineStatus, DeadlineAnalysis } from '../../utils/dateUtils';

export const STATUS_CONFIGS: Record<ApplicationStatus, StatusConfig> = {
  saved: {
    status: 'saved',
    label: 'Saved Opportunity',
    shortLabel: 'Saved',
    description: 'Tracked in your radar for future research',
    badgeStyle: 'bg-slate-700/50 text-slate-300 border-slate-600',
    stepNumber: 1
  },
  researching: {
    status: 'researching',
    label: 'Researching Details',
    shortLabel: 'Researching',
    description: 'Analyzing requirements, eligibility, and organization background',
    badgeStyle: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    stepNumber: 2
  },
  drafting: {
    status: 'drafting',
    label: 'Drafting Application',
    shortLabel: 'Drafting',
    description: 'Writing pitch, tailoring resume, and assembling responses',
    badgeStyle: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    stepNumber: 3
  },
  ready_to_submit: {
    status: 'ready_to_submit',
    label: 'Ready to Submit',
    shortLabel: 'Ready',
    description: 'Final review complete, ready for submission',
    badgeStyle: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    stepNumber: 4
  },
  submitted: {
    status: 'submitted',
    label: 'Submitted',
    shortLabel: 'Submitted',
    description: 'Marked as submitted by user (awaiting response)',
    badgeStyle: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    stepNumber: 5
  },
  interview: {
    status: 'interview',
    label: 'Interview / Stage Active',
    shortLabel: 'Interview',
    description: 'In active review, interview, or hackathon stage',
    badgeStyle: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    stepNumber: 6
  },
  offer: {
    status: 'offer',
    label: 'Accepted / Offer Extended',
    shortLabel: 'Accepted',
    description: 'Selected, accepted, or awarded',
    badgeStyle: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    stepNumber: 7
  },
  rejected: {
    status: 'rejected',
    label: 'Not Selected',
    shortLabel: 'Not Selected',
    description: 'Application was not successful this time',
    badgeStyle: 'bg-red-500/10 text-red-300 border-red-500/30',
    stepNumber: 8
  },
  archived: {
    status: 'archived',
    label: 'Archived',
    shortLabel: 'Archived',
    description: 'Moved out of active focus',
    badgeStyle: 'bg-slate-800 text-slate-400 border-slate-700',
    stepNumber: 9
  }
};

export const ALL_APPLICATION_STATUSES: ApplicationStatus[] = [
  'saved',
  'researching',
  'drafting',
  'ready_to_submit',
  'submitted',
  'interview',
  'offer',
  'rejected',
  'archived'
];

export function isValidStatus(status: string): status is ApplicationStatus {
  return ALL_APPLICATION_STATUSES.includes(status as ApplicationStatus);
}

export function canTransitionStatus(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (!isValidStatus(from) || !isValidStatus(to)) {
    return false;
  }
  return true;
}

export function getDefaultChecklist(): ChecklistItem[] {
  return [
    { id: 'check-1', label: 'Review eligibility & deadline details', completed: false },
    { id: 'check-2', label: 'Tailor CV / Resume for opportunity', completed: false },
    { id: 'check-3', label: 'Generate Copilot pitch or cover letter', completed: false },
    { id: 'check-4', label: 'Prepare required portfolio / repository links', completed: false },
    { id: 'check-5', label: 'Submit official application form', completed: false }
  ];
}

export function isDuplicateApplication(
  existingApps: ApplicationRecord[],
  opportunityId: string,
  excludeId?: string
): boolean {
  if (!opportunityId || !opportunityId.trim()) return false;
  return existingApps.some(
    app => app.opportunityId === opportunityId && app.id !== excludeId
  );
}

export function calculateApplicationDeadlineUrgency(app: ApplicationRecord): DeadlineAnalysis {
  return getDeadlineStatus(app.opportunitySnapshot?.deadline);
}
