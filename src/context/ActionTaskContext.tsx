import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ActionTask, ActionPriority, ActionTaskRow } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  loadGuestTasks,
  upsertGuestTask,
  deleteGuestTask,
  generateGuestTaskId,
  serializeTask,
} from '../utils/actionTaskStorage';

interface CreateTaskInput {
  title: string;
  description?: string;
  dueAt?: string | null;
  priority?: ActionPriority;
  applicationId?: string | null;
  opportunityId?: string | null;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueAt?: string | null;
  priority?: ActionPriority;
  applicationId?: string | null;
  opportunityId?: string | null;
}

interface ActionTaskContextType {
  tasks: ActionTask[];
  isLoading: boolean;
  error: string | null;
  createTask: (input: CreateTaskInput) => Promise<ActionTask>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<ActionTask>;
  completeTask: (id: string) => Promise<ActionTask>;
  reopenTask: (id: string) => Promise<ActionTask>;
  deleteTask: (id: string) => Promise<void>;
  clearError: () => void;
  retryLoadTasks: () => Promise<void>;
}

const ActionTaskContext = createContext<ActionTaskContextType | undefined>(undefined);

function mapRowToTask(row: ActionTaskRow): ActionTask {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    opportunityId: row.opportunity_id,
    title: row.title,
    description: row.description || '',
    dueAt: row.due_at,
    priority: row.priority,
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const ActionTaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, supabaseUser } = useAuth();
  const [tasks, setTasks] = useState<ActionTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      setTasks(loadGuestTasks());
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('action_tasks')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        console.error('[ActionTaskContext] Fetch error:', fetchErr);
        setError(`Failed to load tasks: ${fetchErr.message}`);
        setTasks(loadGuestTasks());
      } else if (data) {
        setTasks((data as ActionTaskRow[]).map(mapRowToTask));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error loading tasks';
      setError(msg);
      setTasks(loadGuestTasks());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, supabaseUser]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = async (input: CreateTaskInput): Promise<ActionTask> => {
    const now = new Date().toISOString();
    const userId = supabaseUser?.id ?? 'guest-user';

    const newTask: ActionTask = {
      id: generateGuestTaskId(),
      userId,
      applicationId: input.applicationId ?? null,
      opportunityId: input.opportunityId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      dueAt: input.dueAt ?? null,
      priority: input.priority ?? 'medium',
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const previousTasks = tasks;
    setTasks((prev) => [newTask, ...prev]);

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      upsertGuestTask(serializeTask(newTask));
      return newTask;
    }

    try {
      const payload = {
        id: newTask.id,
        user_id: newTask.userId,
        application_id: newTask.applicationId,
        opportunity_id: newTask.opportunityId,
        title: newTask.title,
        description: newTask.description,
        due_at: newTask.dueAt,
        priority: newTask.priority,
        completed: newTask.completed,
        created_at: newTask.createdAt,
        updated_at: newTask.updatedAt,
      };

      const { data, error: insertErr } = await supabase
        .from('action_tasks')
        .insert(payload)
        .select('*')
        .single();

      if (insertErr) throw new Error(insertErr.message);

      if (data) {
        const created = mapRowToTask(data as ActionTaskRow);
        setTasks((prev) => prev.map((t) => (t.id === newTask.id ? created : t)));
        return created;
      }
      return newTask;
    } catch (err) {
      setTasks(previousTasks);
      const msg = err instanceof Error ? err.message : 'Failed to save task';
      setError(`Persistence error: ${msg}`);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: UpdateTaskInput): Promise<ActionTask> => {
    const target = tasks.find((t) => t.id === id);
    if (!target) throw new Error(`Task ${id} not found`);

    const now = new Date().toISOString();
    const updated: ActionTask = {
      ...target,
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      ...(updates.dueAt !== undefined && { dueAt: updates.dueAt }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.applicationId !== undefined && { applicationId: updates.applicationId }),
      ...(updates.opportunityId !== undefined && { opportunityId: updates.opportunityId }),
      updatedAt: now,
    };

    const previousTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      upsertGuestTask(serializeTask(updated));
      return updated;
    }

    try {
      const payload: Record<string, unknown> = { updated_at: now };
      if (updates.title !== undefined) payload.title = updated.title;
      if (updates.description !== undefined) payload.description = updated.description;
      if (updates.dueAt !== undefined) payload.due_at = updated.dueAt;
      if (updates.priority !== undefined) payload.priority = updated.priority;
      if (updates.applicationId !== undefined) payload.application_id = updated.applicationId;
      if (updates.opportunityId !== undefined) payload.opportunity_id = updated.opportunityId;

      const { data, error: updateErr } = await supabase
        .from('action_tasks')
        .update(payload)
        .eq('id', id)
        .eq('user_id', supabaseUser.id)
        .select('*')
        .single();

      if (updateErr) throw new Error(updateErr.message);
      if (data) {
        const persisted = mapRowToTask(data as ActionTaskRow);
        setTasks((prev) => prev.map((t) => (t.id === id ? persisted : t)));
        return persisted;
      }
      return updated;
    } catch (err) {
      setTasks(previousTasks);
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      setError(`Persistence error: ${msg}`);
      throw err;
    }
  };

  const completeTask = async (id: string): Promise<ActionTask> => {
    const target = tasks.find((t) => t.id === id);
    if (!target) throw new Error(`Task ${id} not found`);

    const now = new Date().toISOString();
    const updated: ActionTask = {
      ...target,
      completed: true,
      completedAt: now,
      updatedAt: now,
    };

    const previousTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      upsertGuestTask(serializeTask(updated));
      return updated;
    }

    try {
      const { data, error: updateErr } = await supabase
        .from('action_tasks')
        .update({ completed: true, completed_at: now, updated_at: now })
        .eq('id', id)
        .eq('user_id', supabaseUser.id)
        .select('*')
        .single();

      if (updateErr) throw new Error(updateErr.message);
      if (data) {
        const persisted = mapRowToTask(data as ActionTaskRow);
        setTasks((prev) => prev.map((t) => (t.id === id ? persisted : t)));
        return persisted;
      }
      return updated;
    } catch (err) {
      setTasks(previousTasks);
      const msg = err instanceof Error ? err.message : 'Failed to complete task';
      setError(`Persistence error: ${msg}`);
      throw err;
    }
  };

  const reopenTask = async (id: string): Promise<ActionTask> => {
    const target = tasks.find((t) => t.id === id);
    if (!target) throw new Error(`Task ${id} not found`);

    const now = new Date().toISOString();
    const updated: ActionTask = {
      ...target,
      completed: false,
      completedAt: null,
      updatedAt: now,
    };

    const previousTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      upsertGuestTask(serializeTask(updated));
      return updated;
    }

    try {
      const { data, error: updateErr } = await supabase
        .from('action_tasks')
        .update({ completed: false, completed_at: null, updated_at: now })
        .eq('id', id)
        .eq('user_id', supabaseUser.id)
        .select('*')
        .single();

      if (updateErr) throw new Error(updateErr.message);
      if (data) {
        const persisted = mapRowToTask(data as ActionTaskRow);
        setTasks((prev) => prev.map((t) => (t.id === id ? persisted : t)));
        return persisted;
      }
      return updated;
    } catch (err) {
      setTasks(previousTasks);
      const msg = err instanceof Error ? err.message : 'Failed to reopen task';
      setError(`Persistence error: ${msg}`);
      throw err;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const previousTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      deleteGuestTask(id);
      return;
    }

    try {
      const { error: delErr } = await supabase
        .from('action_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', supabaseUser.id);

      if (delErr) throw new Error(delErr.message);
    } catch (err) {
      setTasks(previousTasks);
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      setError(`Persistence error: ${msg}`);
      throw err;
    }
  };

  return (
    <ActionTaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        createTask,
        updateTask,
        completeTask,
        reopenTask,
        deleteTask,
        clearError,
        retryLoadTasks: loadTasks,
      }}
    >
      {children}
    </ActionTaskContext.Provider>
  );
};

export const useActionTasks = (): ActionTaskContextType => {
  const ctx = useContext(ActionTaskContext);
  if (!ctx) throw new Error('useActionTasks must be used within an ActionTaskProvider');
  return ctx;
};
