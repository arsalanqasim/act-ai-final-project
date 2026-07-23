import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApplicationRecord, Opportunity } from '../types';
import {
  ALL_APPLICATION_STATUSES,
  isValidStatus,
  canTransitionStatus,
  getDefaultChecklist,
  isDuplicateApplication,
  calculateApplicationDeadlineUrgency,
  STATUS_CONFIGS
} from '../features/applications/utils';
import {
  loadGuestApplications,
  saveGuestApplications,
  getGuestApplicationByOppId,
  upsertGuestApplication,
  deleteGuestApplication
} from '../utils/applicationStorage';

if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    configurable: true,
    writable: true
  });
}

const mockOpportunity: Opportunity = {
  id: 'opp-test-101',
  title: 'Global AI Hackathon 2026',
  organization: 'DeepMind',
  category: 'Hackathon',
  deadline: '2026-12-31',
  location: 'Remote',
  stipendOrPrize: '$50,000 Prize Pool',
  techStackOrEligibility: ['Python', 'TypeScript', 'LLMs'],
  description: 'Build cutting edge agentic tools.',
  applyUrl: 'https://example.com/apply',
  postedDate: '2026-07-01'
};

const mockApplicationRecord: ApplicationRecord = {
  id: 'app-test-uuid-1',
  userId: 'user-guest',
  opportunityId: 'opp-test-101',
  opportunitySnapshot: mockOpportunity,
  status: 'saved',
  notes: 'Key note',
  nextAction: 'Research requirements',
  nextActionAt: null,
  submittedAt: null,
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-20T10:00:00.000Z',
  checklist: getDefaultChecklist()
};

describe('Application Workflow Feature & Utils', () => {

  describe('Status Transition Rules', () => {
    it('defines 9 complete application statuses with configuration metadata', () => {
      expect(ALL_APPLICATION_STATUSES).toHaveLength(9);
      ALL_APPLICATION_STATUSES.forEach(status => {
        expect(STATUS_CONFIGS[status]).toBeDefined();
        expect(STATUS_CONFIGS[status].label).toBeTruthy();
        expect(STATUS_CONFIGS[status].stepNumber).toBeGreaterThan(0);
      });
    });

    it('validates valid status strings with isValidStatus', () => {
      expect(isValidStatus('saved')).toBe(true);
      expect(isValidStatus('drafting')).toBe(true);
      expect(isValidStatus('ready_to_submit')).toBe(true);
      expect(isValidStatus('submitted')).toBe(true);
      expect(isValidStatus('interview')).toBe(true);
      expect(isValidStatus('offer')).toBe(true);
      expect(isValidStatus('rejected')).toBe(true);
      expect(isValidStatus('archived')).toBe(true);
      expect(isValidStatus('invalid_status')).toBe(false);
    });

    it('permits status transitions between valid states', () => {
      expect(canTransitionStatus('saved', 'researching')).toBe(true);
      expect(canTransitionStatus('researching', 'drafting')).toBe(true);
      expect(canTransitionStatus('drafting', 'submitted')).toBe(true);
      expect(canTransitionStatus('submitted', 'interview')).toBe(true);
      expect(canTransitionStatus('interview', 'offer')).toBe(true);
      expect(canTransitionStatus('interview', 'rejected')).toBe(true);
    });
  });

  describe('Duplicate Application Prevention Helpers', () => {
    const apps: ApplicationRecord[] = [mockApplicationRecord];

    it('returns true if an application already exists for the opportunity ID', () => {
      expect(isDuplicateApplication(apps, 'opp-test-101')).toBe(true);
    });

    it('returns false if no application exists for a different opportunity ID', () => {
      expect(isDuplicateApplication(apps, 'opp-test-999')).toBe(false);
    });

    it('ignores duplicate check when updating the same application ID (excludeId)', () => {
      expect(isDuplicateApplication(apps, 'opp-test-101', 'app-test-uuid-1')).toBe(false);
    });

    it('handles empty or whitespace opportunity IDs gracefully', () => {
      expect(isDuplicateApplication(apps, '')).toBe(false);
      expect(isDuplicateApplication(apps, '  ')).toBe(false);
    });
  });

  describe('Deadline Urgency Integration', () => {
    it('calculates Open status for future deadline', () => {
      const futureRecord: ApplicationRecord = {
        ...mockApplicationRecord,
        opportunitySnapshot: { ...mockOpportunity, deadline: '2026-12-31' }
      };
      const res = calculateApplicationDeadlineUrgency(futureRecord);
      expect(res.status).toBe('Open');
      expect(res.isExpired).toBe(false);
    });

    it('calculates Expired status for past deadline', () => {
      const pastRecord: ApplicationRecord = {
        ...mockApplicationRecord,
        opportunitySnapshot: { ...mockOpportunity, deadline: '2020-01-01' }
      };
      const res = calculateApplicationDeadlineUrgency(pastRecord);
      expect(res.status).toBe('Expired');
      expect(res.isExpired).toBe(true);
    });

    it('handles missing or unspecified deadlines', () => {
      const noDateRecord: ApplicationRecord = {
        ...mockApplicationRecord,
        opportunitySnapshot: { ...mockOpportunity, deadline: '' }
      };
      const res = calculateApplicationDeadlineUrgency(noDateRecord);
      expect(res.status).toBe('Date unknown');
    });
  });

  describe('Default Checklist Generation', () => {
    it('generates standard application checklist items', () => {
      const checklist = getDefaultChecklist();
      expect(checklist).toBeInstanceOf(Array);
      expect(checklist.length).toBeGreaterThanOrEqual(4);
      expect(checklist.every(item => item.id && item.label && item.completed === false)).toBe(true);
    });
  });

});

describe('Guest Application Storage (applicationStorage.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saves and loads guest application records correctly', () => {
    saveGuestApplications([mockApplicationRecord]);
    const loaded = loadGuestApplications();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('app-test-uuid-1');
    expect(loaded[0].opportunityId).toBe('opp-test-101');
    expect(loaded[0].status).toBe('saved');
    expect(loaded[0].opportunitySnapshot.title).toBe('Global AI Hackathon 2026');
  });

  it('retrieves guest application by opportunity ID', () => {
    saveGuestApplications([mockApplicationRecord]);
    const found = getGuestApplicationByOppId('opp-test-101');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('app-test-uuid-1');

    const notFound = getGuestApplicationByOppId('non-existent');
    expect(notFound).toBeNull();
  });

  it('upserts guest application records cleanly', () => {
    upsertGuestApplication(mockApplicationRecord);
    let loaded = loadGuestApplications();
    expect(loaded).toHaveLength(1);

    const updatedRecord: ApplicationRecord = {
      ...mockApplicationRecord,
      status: 'submitted',
      notes: 'Updated note'
    };

    upsertGuestApplication(updatedRecord);
    loaded = loadGuestApplications();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].status).toBe('submitted');
    expect(loaded[0].notes).toBe('Updated note');
  });

  it('deletes guest application records by ID', () => {
    saveGuestApplications([mockApplicationRecord]);
    expect(loadGuestApplications()).toHaveLength(1);

    deleteGuestApplication('app-test-uuid-1');
    expect(loadGuestApplications()).toHaveLength(0);
  });

  it('recovers gracefully from corrupted or invalid JSON in localStorage', () => {
    localStorage.setItem('opp_pulse_applications_v1', '{ invalid json syntax ...');
    const loaded = loadGuestApplications();
    expect(loaded).toEqual([]);
  });

  it('recovers gracefully when stored item is not an array', () => {
    localStorage.setItem('opp_pulse_applications_v1', JSON.stringify({ notAnArray: true }));
    const loaded = loadGuestApplications();
    expect(loaded).toEqual([]);
  });
});
