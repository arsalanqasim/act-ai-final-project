/**
 * actionPrioritization.ts
 * Deterministic, explainable prioritization engine for Career Command Center.
 * No opaque AI reasoning. Every score and reason is traceable.
 */
import type { ActionTask, ApplicationRecord, Opportunity, MatchResult, PrioritizedAction } from '../types';
import { getDeadlineStatus } from './dateUtils';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function daysFromNow(isoDate: string | null | undefined, now: Date = new Date()): number | null {
  if (!isoDate) return null;
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(isoDate);
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function deadlineUrgencyLabel(days: number | null): string {
  if (days === null) return 'Deadline unknown';
  if (days < 0) return `Deadline passed ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Deadline is today';
  if (days === 1) return 'Deadline tomorrow';
  if (days <= 3) return `Deadline in ${days} days`;
  if (days <= 7) return `Deadline in ${days} days`;
  return `Deadline in ${days} days`;
}

function urgencyFromScore(score: number): PrioritizedAction['urgency'] {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Task prioritization
// ---------------------------------------------------------------------------

export function prioritizeTask(
  task: ActionTask,
  _now: Date = new Date()
): PrioritizedAction | null {
  if (task.completed) return null;

  let score = 30; // base
  const reasons: string[] = [];

  // Priority bonus
  const priorityBonus: Record<string, number> = {
    urgent: 40,
    high: 25,
    medium: 10,
    low: 0,
  };
  score += priorityBonus[task.priority] ?? 0;
  if (task.priority === 'urgent') reasons.push('Marked as urgent');
  else if (task.priority === 'high') reasons.push('High priority task');

  // Due date urgency
  const daysLeft = daysFromNow(task.dueAt, _now);
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      score += 35;
      reasons.push('Your next action date has passed');
    } else if (daysLeft === 0) {
      score += 30;
      reasons.push('Task is due today');
    } else if (daysLeft <= 2) {
      score += 25;
      reasons.push(`Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`);
    } else if (daysLeft <= 7) {
      score += 15;
      reasons.push(`Due in ${daysLeft} days`);
    }
  }

  // Cap at 99
  score = Math.min(score, 99);

  return {
    type: 'task',
    id: task.id,
    title: task.title,
    subtitle: task.description || 'Action task',
    score,
    reasons,
    urgency: urgencyFromScore(score),
    dueDate: task.dueAt,
    taskId: task.id,
    applicationId: task.applicationId ?? undefined,
    opportunityId: task.opportunityId ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Application prioritization
// ---------------------------------------------------------------------------



export function prioritizeApplication(
  app: ApplicationRecord,
  matchResult: MatchResult | undefined,
  _now: Date = new Date()
): PrioritizedAction | null {
  // Archived / offer / rejected are not actionable in the queue
  if (['archived', 'offer', 'rejected'].includes(app.status)) return null;

  const deadline = getDeadlineStatus(app.opportunitySnapshot?.deadline);

  // Never promote expired opportunities (unless already in a late stage)
  if (deadline.isExpired && !['interview', 'offer'].includes(app.status)) {
    return null;
  }

  let score = 20; // base
  const reasons: string[] = [];

  // Application status signals
  if (app.status === 'ready_to_submit') {
    score += 30;
    reasons.push('Application is ready to submit');
  } else if (app.status === 'drafting') {
    score += 20;
    reasons.push('Application is being drafted');
  } else if (app.status === 'researching') {
    score += 12;
    reasons.push('You started researching this opportunity');
  } else if (app.status === 'interview') {
    score += 35;
    reasons.push('Interview / selection stage is active');
  } else if (app.status === 'submitted') {
    score += 10;
    reasons.push('Application submitted — awaiting response');
  } else if (app.status === 'saved') {
    score += 5;
    reasons.push('You saved this opportunity but have not started an application');
  }

  // Deadline urgency
  if (deadline.daysRemaining !== null && !deadline.isExpired) {
    const d = deadline.daysRemaining;
    if (d === 0) {
      score += 30;
      reasons.push(deadlineUrgencyLabel(d));
    } else if (d <= 2) {
      score += 28;
      reasons.push(deadlineUrgencyLabel(d));
    } else if (d <= 7) {
      score += 20;
      reasons.push(deadlineUrgencyLabel(d));
    } else if (d <= 14) {
      score += 10;
      reasons.push(deadlineUrgencyLabel(d));
    }
  }

  // Match score bonus
  if (matchResult) {
    if (matchResult.score >= 85) {
      score += 15;
      reasons.push(`High match score: ${matchResult.score}%`);
    } else if (matchResult.score >= 70) {
      score += 8;
      reasons.push(`Good match score: ${matchResult.score}%`);
    }
  }

  // Next action overdue
  const nextActionDays = daysFromNow(app.nextActionAt, _now);
  if (nextActionDays !== null && nextActionDays < 0) {
    score += 20;
    reasons.push('Your next action date has passed');
  } else if (nextActionDays !== null && nextActionDays === 0) {
    score += 15;
    reasons.push('Next action due today');
  }

  score = Math.min(score, 99);

  return {
    type: 'application',
    id: app.id,
    title: app.opportunitySnapshot?.title ?? 'Unknown Opportunity',
    subtitle: app.opportunitySnapshot?.organization ?? '',
    score,
    reasons,
    urgency: urgencyFromScore(score),
    dueDate: app.opportunitySnapshot?.deadline ?? null,
    applicationId: app.id,
    opportunityId: app.opportunityId,
  };
}

// ---------------------------------------------------------------------------
// Saved opportunity prioritization (no application yet)
// ---------------------------------------------------------------------------

export function prioritizeSavedOpportunity(
  opp: Opportunity,
  matchResult: MatchResult | undefined,
  hasApplication: boolean,
  _now: Date = new Date()
): PrioritizedAction | null {
  if (hasApplication) return null;

  const deadline = getDeadlineStatus(opp.deadline);
  // Never surface expired opportunities
  if (deadline.isExpired) return null;

  let score = 10;
  const reasons: string[] = [];

  reasons.push('You saved this opportunity but have not started an application');

  // Trust tier bonus
  if (opp.trustTier === 'tier-1-official') {
    score += 15;
    reasons.push('Official source');
  } else if (opp.trustTier === 'tier-2-verified-platform') {
    score += 8;
    reasons.push('Verified platform source');
  } else if (opp.trustTier === 'tier-3-community') {
    // Community tier — lower trust, add a note
    reasons.push('Community listing — verify details before applying');
  }

  // Trust score bonus
  if (opp.trustScore !== undefined && opp.trustScore >= 80) {
    score += 5;
  }

  // Deadline urgency
  if (deadline.daysRemaining !== null) {
    const d = deadline.daysRemaining;
    if (d === 0) {
      score += 30;
      reasons.push(deadlineUrgencyLabel(d));
    } else if (d <= 2) {
      score += 25;
      reasons.push(deadlineUrgencyLabel(d));
    } else if (d <= 7) {
      score += 15;
      reasons.push(deadlineUrgencyLabel(d));
    } else if (d <= 14) {
      score += 8;
      reasons.push(deadlineUrgencyLabel(d));
    }
  }

  // Match score bonus
  if (matchResult) {
    if (matchResult.score >= 85) {
      score += 12;
      reasons.push(`High match score: ${matchResult.score}%`);
    } else if (matchResult.score >= 70) {
      score += 6;
      reasons.push(`Good match score: ${matchResult.score}%`);
    }
  }

  score = Math.min(score, 99);

  return {
    type: 'saved_opportunity',
    id: opp.id,
    title: opp.title,
    subtitle: opp.organization,
    score,
    reasons,
    urgency: urgencyFromScore(score),
    dueDate: opp.deadline ?? null,
    opportunityId: opp.id,
  };
}

// ---------------------------------------------------------------------------
// Main aggregator
// ---------------------------------------------------------------------------

export interface PrioritizationInput {
  tasks: ActionTask[];
  applications: ApplicationRecord[];
  savedOpportunities: Opportunity[];
  matchResults: Record<string, MatchResult>;
  now?: Date;
}

export function buildPrioritizedActions(input: PrioritizationInput): PrioritizedAction[] {
  const { tasks, applications, savedOpportunities, matchResults, now = new Date() } = input;

  const applicationIdSet = new Set(applications.map((a) => a.opportunityId));

  const results: PrioritizedAction[] = [];

  // Tasks
  for (const task of tasks) {
    const action = prioritizeTask(task, now);
    if (action) results.push(action);
  }

  // Applications
  for (const app of applications) {
    const match = matchResults[app.opportunityId];
    const action = prioritizeApplication(app, match, now);
    if (action) results.push(action);
  }

  // Saved opportunities without applications
  for (const opp of savedOpportunities) {
    const hasApp = applicationIdSet.has(opp.id);
    const match = matchResults[opp.id];
    const action = prioritizeSavedOpportunity(opp, match, hasApp, now);
    if (action) results.push(action);
  }

  // Sort: higher score first, then by type (task > application > saved)
  const typeOrder: Record<PrioritizedAction['type'], number> = {
    task: 0,
    application: 1,
    saved_opportunity: 2,
  };

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return results;
}
