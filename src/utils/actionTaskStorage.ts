/**
 * actionTaskStorage.ts
 * Guest-mode localStorage helpers for ActionTask objects.
 * Namespaced key prevents collision with other storage entries.
 */
import type { ActionTask, ActionPriority } from '../types';

export const GUEST_TASKS_KEY = 'opp_pulse_action_tasks_v1';

function isValidActionTask(item: unknown): item is ActionTask {
  if (!item || typeof item !== 'object') return false;
  const t = item as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.userId === 'string' &&
    typeof t.title === 'string' &&
    typeof t.priority === 'string' &&
    typeof t.completed === 'boolean'
  );
}

export function loadGuestTasks(): ActionTask[] {
  try {
    const raw = localStorage.getItem(GUEST_TASKS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[actionTaskStorage] Guest tasks data is not an array. Resetting.');
      return [];
    }
    return parsed
      .filter(isValidActionTask)
      .map((task) => ({
        ...task,
        description: task.description || '',
        applicationId: task.applicationId ?? null,
        opportunityId: task.opportunityId ?? null,
        dueAt: task.dueAt ?? null,
        completedAt: task.completedAt ?? null,
      }));
  } catch (err) {
    console.error('[actionTaskStorage] Error reading guest tasks from localStorage:', err);
    return [];
  }
}

export function saveGuestTasks(tasks: ActionTask[]): void {
  try {
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('[actionTaskStorage] Error saving guest tasks to localStorage:', err);
  }
}

export function upsertGuestTask(task: ActionTask): ActionTask[] {
  const current = loadGuestTasks();
  const index = current.findIndex((t) => t.id === task.id);
  let updated: ActionTask[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...task, updatedAt: new Date().toISOString() };
  } else {
    updated = [task, ...current];
  }
  saveGuestTasks(updated);
  return updated;
}

export function deleteGuestTask(id: string): ActionTask[] {
  const current = loadGuestTasks();
  const updated = current.filter((t) => t.id !== id);
  saveGuestTasks(updated);
  return updated;
}

export function generateGuestTaskId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Serialize a task to plain JSON-safe object (identity for localStorage). */
export function serializeTask(task: ActionTask): ActionTask {
  return {
    id: task.id,
    userId: task.userId,
    applicationId: task.applicationId,
    opportunityId: task.opportunityId,
    title: task.title,
    description: task.description,
    dueAt: task.dueAt,
    priority: task.priority as ActionPriority,
    completed: task.completed,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
