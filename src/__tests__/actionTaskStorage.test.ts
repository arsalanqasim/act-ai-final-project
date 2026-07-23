/**
 * actionTaskStorage.test.ts
 * Tests for the guest-mode localStorage helpers.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadGuestTasks,
  saveGuestTasks,
  upsertGuestTask,
  deleteGuestTask,
  generateGuestTaskId,
  serializeTask,
  GUEST_TASKS_KEY,
} from '../utils/actionTaskStorage';
import type { ActionTask } from '../types';

// Polyfill localStorage for node test environment (matches applicationWorkflow.test.ts pattern)
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
    writable: true
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<ActionTask> = {}): ActionTask {
  const now = new Date().toISOString();
  return {
    id: `task-${Math.random().toString(36).slice(2)}`,
    userId: 'guest-user',
    applicationId: null,
    opportunityId: null,
    title: 'Default Task',
    description: '',
    dueAt: null,
    priority: 'medium',
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// loadGuestTasks
// ─────────────────────────────────────────────────────────────────────────────

describe('loadGuestTasks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when localStorage is empty', () => {
    expect(loadGuestTasks()).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    localStorage.setItem(GUEST_TASKS_KEY, 'not-json{{{');
    expect(loadGuestTasks()).toEqual([]);
  });

  it('returns empty array when stored value is not an array', () => {
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify({ id: 'not-array' }));
    expect(loadGuestTasks()).toEqual([]);
  });

  it('filters out malformed task objects', () => {
    const valid = makeTask({ id: 'valid-1' });
    const malformed = { foo: 'bar' };
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify([valid, malformed]));
    const result = loadGuestTasks();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('valid-1');
  });

  it('returns valid tasks with defaults applied', () => {
    const task = makeTask({ id: 'task-a' });
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify([task]));
    const result = loadGuestTasks();
    expect(result[0].description).toBe('');
    expect(result[0].applicationId).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// saveGuestTasks
// ─────────────────────────────────────────────────────────────────────────────

describe('saveGuestTasks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists tasks to localStorage', () => {
    const tasks = [makeTask({ id: 'task-1' }), makeTask({ id: 'task-2' })];
    saveGuestTasks(tasks);
    const raw = localStorage.getItem(GUEST_TASKS_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(2);
  });

  it('overwrites previous data', () => {
    const first = [makeTask({ id: 'old-task' })];
    saveGuestTasks(first);
    const second = [makeTask({ id: 'new-task' })];
    saveGuestTasks(second);
    const result = loadGuestTasks();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('new-task');
  });

  it('can save an empty array', () => {
    saveGuestTasks([]);
    expect(loadGuestTasks()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// upsertGuestTask
// ─────────────────────────────────────────────────────────────────────────────

describe('upsertGuestTask', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inserts a new task when none exist', () => {
    const task = makeTask({ id: 'task-new' });
    upsertGuestTask(task);
    const result = loadGuestTasks();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task-new');
  });

  it('prepends new task before existing tasks', () => {
    const first = makeTask({ id: 'task-first', title: 'First' });
    upsertGuestTask(first);
    const second = makeTask({ id: 'task-second', title: 'Second' });
    upsertGuestTask(second);
    const result = loadGuestTasks();
    expect(result[0].id).toBe('task-second');
    expect(result[1].id).toBe('task-first');
  });

  it('updates an existing task by id', () => {
    const task = makeTask({ id: 'task-update', title: 'Original' });
    upsertGuestTask(task);
    const updated = { ...task, title: 'Updated' };
    upsertGuestTask(updated);
    const result = loadGuestTasks();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Updated');
  });

  it('updates the updatedAt timestamp on update', () => {
    const task = makeTask({ id: 'task-ts', updatedAt: '2026-01-01T00:00:00Z' });
    upsertGuestTask(task);
    const updated = { ...task, title: 'Changed' };
    upsertGuestTask(updated);
    const result = loadGuestTasks();
    expect(result[0].updatedAt).not.toBe('2026-01-01T00:00:00Z');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteGuestTask
// ─────────────────────────────────────────────────────────────────────────────

describe('deleteGuestTask', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes the task with matching id', () => {
    const task1 = makeTask({ id: 'del-task-1' });
    const task2 = makeTask({ id: 'del-task-2' });
    saveGuestTasks([task1, task2]);
    deleteGuestTask('del-task-1');
    const result = loadGuestTasks();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('del-task-2');
  });

  it('does nothing when id does not exist', () => {
    const task = makeTask({ id: 'keep-task' });
    saveGuestTasks([task]);
    deleteGuestTask('nonexistent-id');
    const result = loadGuestTasks();
    expect(result).toHaveLength(1);
  });

  it('returns empty array when last task is deleted', () => {
    const task = makeTask({ id: 'last-task' });
    saveGuestTasks([task]);
    deleteGuestTask('last-task');
    expect(loadGuestTasks()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateGuestTaskId
// ─────────────────────────────────────────────────────────────────────────────

describe('generateGuestTaskId', () => {
  it('generates a non-empty string', () => {
    const id = generateGuestTaskId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, generateGuestTaskId));
    expect(ids.size).toBe(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// serializeTask
// ─────────────────────────────────────────────────────────────────────────────

describe('serializeTask', () => {
  it('returns a plain object with all required fields', () => {
    const task = makeTask({ id: 'ser-1', title: 'Serialized' });
    const serialized = serializeTask(task);
    expect(serialized.id).toBe('ser-1');
    expect(serialized.title).toBe('Serialized');
    expect(serialized.priority).toBe('medium');
    expect(serialized.completed).toBe(false);
  });

  it('can be JSON-stringified and parsed back cleanly', () => {
    const task = makeTask({ id: 'ser-json', dueAt: '2026-08-01T00:00:00Z' });
    const serialized = serializeTask(task);
    const roundtripped = JSON.parse(JSON.stringify(serialized));
    expect(roundtripped.id).toBe(task.id);
    expect(roundtripped.dueAt).toBe(task.dueAt);
  });

  it('preserves null fields', () => {
    const task = makeTask({ applicationId: null, opportunityId: null });
    const serialized = serializeTask(task);
    expect(serialized.applicationId).toBeNull();
    expect(serialized.opportunityId).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Guest CRUD lifecycle (integration)
// ─────────────────────────────────────────────────────────────────────────────

describe('Guest task lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('create → update → complete → delete workflow', () => {
    // Create
    const task = makeTask({ id: 'lifecycle-1', title: 'Initial Title' });
    upsertGuestTask(task);
    expect(loadGuestTasks()).toHaveLength(1);

    // Update title
    upsertGuestTask({ ...task, title: 'Updated Title' });
    expect(loadGuestTasks()[0].title).toBe('Updated Title');

    // Complete
    const completed = { ...task, title: 'Updated Title', completed: true, completedAt: new Date().toISOString() };
    upsertGuestTask(completed);
    expect(loadGuestTasks()[0].completed).toBe(true);
    expect(loadGuestTasks()[0].completedAt).not.toBeNull();

    // Delete
    deleteGuestTask('lifecycle-1');
    expect(loadGuestTasks()).toHaveLength(0);
  });

  it('multiple tasks remain correctly ordered', () => {
    ['A', 'B', 'C'].forEach((letter) =>
      upsertGuestTask(makeTask({ id: `task-${letter}`, title: letter }))
    );
    // C was inserted last, so it should be first (prepended)
    const result = loadGuestTasks();
    expect(result[0].title).toBe('C');
  });
});
