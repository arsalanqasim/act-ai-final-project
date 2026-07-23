import { ApplicationStatus, ChecklistItem, ApplicationRecord, ApplicationRow } from '../../types';

export type { ApplicationStatus, ChecklistItem, ApplicationRecord, ApplicationRow };

export interface StatusConfig {
  status: ApplicationStatus;
  label: string;
  shortLabel: string;
  description: string;
  badgeStyle: string;
  stepNumber: number;
}

export interface ApplicationFilterOptions {
  status?: ApplicationStatus | 'all';
  searchQuery?: string;
}
