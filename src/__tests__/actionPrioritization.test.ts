/**
 * actionPrioritization.test.ts
 * Tests for the deterministic action prioritization engine.
 */
import { describe, it, expect } from 'vitest';
import {
  buildPrioritizedActions,
  prioritizeTask,
  prioritizeApplication,
  prioritizeSavedOpportunity,
} from '../utils/actionPrioritization';
import type {
  ActionTask,
  ApplicationRecord,
  Opportunity,
  MatchResult,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-07-23T12:00:00Z');

function makeTask(overrides: Partial<ActionTask> = {}): ActionTask {
  return {
    id: 'task-1',
    userId: 'user-1',
    applicationId: null,
    opportunityId: null,
    title: 'Test Task',
    description: '',
    dueAt: null,
    priority: 'medium',
    completed: false,
    completedAt: null,
    createdAt: TODAY.toISOString(),
    updatedAt: TODAY.toISOString(),
    ...overrides,
  };
}

function makeApp(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  const deadline = '2026-08-10'; // 18 days from today
  return {
    id: 'app-1',
    userId: 'user-1',
    opportunityId: 'opp-1',
    opportunitySnapshot: {
      id: 'opp-1',
      title: 'Test Opportunity',
      organization: 'Test Org',
      category: 'Hackathon',
      deadline,
      location: 'Remote',
      stipendOrPrize: '$1000',
      techStackOrEligibility: [],
      description: '',
      applyUrl: 'https://example.com',
      postedDate: '2026-07-01',
    },
    status: 'saved',
    notes: '',
    nextAction: '',
    nextActionAt: null,
    submittedAt: null,
    createdAt: TODAY.toISOString(),
    updatedAt: TODAY.toISOString(),
    checklist: [],
    ...overrides,
  };
}

function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-2',
    title: 'Open Scholarship',
    organization: 'Global Fund',
    category: 'Scholarship',
    deadline: '2026-08-15',
    location: 'Global',
    stipendOrPrize: '$5000',
    techStackOrEligibility: [],
    description: '',
    applyUrl: 'https://example.com/scholarship',
    postedDate: '2026-07-01',
    trustTier: 'tier-1-official',
    trustScore: 90,
    ...overrides,
  };
}

function makeMatch(score: number): MatchResult {
  return {
    opportunityId: 'opp-1',
    score,
    verdict: score >= 85 ? 'Excellent Match' : score >= 70 ? 'Good Match' : 'Moderate Match',
    matchingSkills: [],
    missingSkills: [],
    reasons: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// prioritizeTask
// ─────────────────────────────────────────────────────────────────────────────

describe('prioritizeTask', () => {
  it('returns null for completed tasks', () => {
    const task = makeTask({ completed: true });
    expect(prioritizeTask(task, TODAY)).toBeNull();
  });

  it('gives higher score to urgent priority', () => {
    const urgentTask = makeTask({ priority: 'urgent', id: 'a' });
    const lowTask = makeTask({ priority: 'low', id: 'b' });
    const urgentAction = prioritizeTask(urgentTask, TODAY)!;
    const lowAction = prioritizeTask(lowTask, TODAY)!;
    expect(urgentAction.score).toBeGreaterThan(lowAction.score);
  });

  it('adds overdue reason when due date passed', () => {
    const task = makeTask({ dueAt: '2026-07-20T00:00:00Z' }); // 3 days ago
    const action = prioritizeTask(task, TODAY)!;
    expect(action.reasons.some((r) => r.includes('has passed'))).toBe(true);
    expect(action.score).toBeGreaterThanOrEqual(50);
  });

  it('adds "due today" reason for today', () => {
    const task = makeTask({ dueAt: '2026-07-23T00:00:00Z' });
    const action = prioritizeTask(task, TODAY)!;
    expect(action.reasons.some((r) => r.toLowerCase().includes('today'))).toBe(true);
  });

  it('urgency is critical for very high score', () => {
    const task = makeTask({ priority: 'urgent', dueAt: '2026-07-20T00:00:00Z' });
    const action = prioritizeTask(task, TODAY)!;
    expect(['critical', 'high']).toContain(action.urgency);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prioritizeApplication
// ─────────────────────────────────────────────────────────────────────────────

describe('prioritizeApplication', () => {
  it('returns null for archived applications', () => {
    const app = makeApp({ status: 'archived' });
    expect(prioritizeApplication(app, undefined, TODAY)).toBeNull();
  });

  it('returns null for expired opportunity not in interview/offer', () => {
    const app = makeApp({
      status: 'saved',
      opportunitySnapshot: {
        ...makeApp().opportunitySnapshot,
        deadline: '2026-01-01', // expired
      },
    });
    expect(prioritizeApplication(app, undefined, TODAY)).toBeNull();
  });

  it('returns non-null for interview stage even if expired', () => {
    const app = makeApp({
      status: 'interview',
      opportunitySnapshot: {
        ...makeApp().opportunitySnapshot,
        deadline: '2026-01-01',
      },
    });
    expect(prioritizeApplication(app, undefined, TODAY)).not.toBeNull();
  });

  it('ready_to_submit gets higher score than saved', () => {
    const readyApp = makeApp({ id: 'app-ready', status: 'ready_to_submit' });
    const savedApp = makeApp({ id: 'app-saved', status: 'saved' });
    const readyAction = prioritizeApplication(readyApp, undefined, TODAY)!;
    const savedAction = prioritizeApplication(savedApp, undefined, TODAY)!;
    expect(readyAction.score).toBeGreaterThan(savedAction.score);
  });

  it('high match score adds points and reason', () => {
    const app = makeApp({ status: 'drafting' });
    const highMatch = makeMatch(90);
    const lowMatch = makeMatch(50);
    const highAction = prioritizeApplication(app, highMatch, TODAY)!;
    const lowAction = prioritizeApplication(app, lowMatch, TODAY)!;
    expect(highAction.score).toBeGreaterThan(lowAction.score);
    expect(highAction.reasons.some((r) => r.includes('match score'))).toBe(true);
  });

  it('near-deadline application gets deadline reason', () => {
    const app = makeApp({
      status: 'drafting',
      opportunitySnapshot: {
        ...makeApp().opportunitySnapshot,
        deadline: '2026-07-25', // 2 days from today
      },
    });
    const action = prioritizeApplication(app, undefined, TODAY)!;
    expect(action.reasons.some((r) => r.toLowerCase().includes('deadline'))).toBe(true);
  });

  it('overdue nextActionAt adds reason', () => {
    const app = makeApp({
      status: 'researching',
      nextActionAt: '2026-07-20T00:00:00Z', // 3 days ago
    });
    const action = prioritizeApplication(app, undefined, TODAY)!;
    expect(action.reasons.some((r) => r.includes('has passed'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prioritizeSavedOpportunity
// ─────────────────────────────────────────────────────────────────────────────

describe('prioritizeSavedOpportunity', () => {
  it('returns null when opportunity has an application', () => {
    const opp = makeOpportunity();
    expect(prioritizeSavedOpportunity(opp, undefined, true, TODAY)).toBeNull();
  });

  it('returns null for expired opportunities', () => {
    const opp = makeOpportunity({ deadline: '2026-01-01' });
    expect(prioritizeSavedOpportunity(opp, undefined, false, TODAY)).toBeNull();
  });

  it('includes "saved but no application" reason', () => {
    const opp = makeOpportunity();
    const action = prioritizeSavedOpportunity(opp, undefined, false, TODAY)!;
    expect(action.reasons.some((r) => r.includes('not started'))).toBe(true);
  });

  it('official source boosts score', () => {
    const officialOpp = makeOpportunity({ trustTier: 'tier-1-official' });
    const communityOpp = makeOpportunity({ trustTier: 'tier-3-community', id: 'opp-3' });
    const officialAction = prioritizeSavedOpportunity(officialOpp, undefined, false, TODAY)!;
    const communityAction = prioritizeSavedOpportunity(communityOpp, undefined, false, TODAY)!;
    expect(officialAction.score).toBeGreaterThan(communityAction.score);
    expect(officialAction.reasons.some((r) => r.includes('Official'))).toBe(true);
  });

  it('high match boosts score and adds match reason', () => {
    const opp = makeOpportunity();
    const match: MatchResult = { ...makeMatch(90), opportunityId: opp.id };
    const action = prioritizeSavedOpportunity(opp, match, false, TODAY)!;
    expect(action.reasons.some((r) => r.includes('match score'))).toBe(true);
  });

  it('community tier gets a note reason', () => {
    const opp = makeOpportunity({ trustTier: 'tier-3-community' });
    const action = prioritizeSavedOpportunity(opp, undefined, false, TODAY)!;
    expect(action.reasons.some((r) => r.includes('Community') || r.includes('verify'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildPrioritizedActions (integration)
// ─────────────────────────────────────────────────────────────────────────────

describe('buildPrioritizedActions', () => {
  it('returns empty array for empty inputs', () => {
    const result = buildPrioritizedActions({
      tasks: [],
      applications: [],
      savedOpportunities: [],
      matchResults: {},
      now: TODAY,
    });
    expect(result).toEqual([]);
  });

  it('sorts by score descending', () => {
    const urgentTask = makeTask({ priority: 'urgent', dueAt: '2026-07-20T00:00:00Z' });
    const savedApp = makeApp({ status: 'saved' });
    const result = buildPrioritizedActions({
      tasks: [urgentTask],
      applications: [savedApp],
      savedOpportunities: [],
      matchResults: {},
      now: TODAY,
    });
    expect(result.length).toBe(2);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it('excludes completed tasks', () => {
    const completedTask = makeTask({ completed: true });
    const result = buildPrioritizedActions({
      tasks: [completedTask],
      applications: [],
      savedOpportunities: [],
      matchResults: {},
      now: TODAY,
    });
    expect(result.filter((a) => a.type === 'task')).toHaveLength(0);
  });

  it('excludes expired saved opportunities', () => {
    const expiredOpp = makeOpportunity({ deadline: '2025-01-01' });
    const result = buildPrioritizedActions({
      tasks: [],
      applications: [],
      savedOpportunities: [expiredOpp],
      matchResults: {},
      now: TODAY,
    });
    expect(result.filter((a) => a.type === 'saved_opportunity')).toHaveLength(0);
  });

  it('does not duplicate: saved opportunity with existing application is excluded', () => {
    const opp = makeOpportunity({ id: 'opp-1' });
    const app = makeApp({ opportunityId: 'opp-1' });
    const result = buildPrioritizedActions({
      tasks: [],
      applications: [app],
      savedOpportunities: [opp],
      matchResults: {},
      now: TODAY,
    });
    expect(result.filter((a) => a.type === 'saved_opportunity')).toHaveLength(0);
  });

  it('high-trust high-match opportunity scores higher than no-match', () => {
    const highOpp = makeOpportunity({ id: 'opp-high', trustTier: 'tier-1-official', deadline: '2026-07-25' });
    const lowOpp = makeOpportunity({ id: 'opp-low', trustTier: 'tier-3-community', deadline: '2026-09-01' });
    const highMatch: MatchResult = { ...makeMatch(90), opportunityId: 'opp-high' };

    const result = buildPrioritizedActions({
      tasks: [],
      applications: [],
      savedOpportunities: [highOpp, lowOpp],
      matchResults: { 'opp-high': highMatch },
      now: TODAY,
    });

    const highIdx = result.findIndex((a) => a.opportunityId === 'opp-high');
    const lowIdx = result.findIndex((a) => a.opportunityId === 'opp-low');
    expect(highIdx).toBeLessThan(lowIdx);
  });
});
