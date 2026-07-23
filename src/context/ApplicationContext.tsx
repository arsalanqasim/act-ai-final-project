import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ApplicationRecord, ApplicationRow, ApplicationStatus, Opportunity, ChecklistItem } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  loadGuestApplications,
  upsertGuestApplication,
  deleteGuestApplication
} from '../utils/applicationStorage';
import { getDefaultChecklist, isDuplicateApplication } from '../features/applications/utils';

interface ApplicationContextType {
  applications: ApplicationRecord[];
  isLoading: boolean;
  error: string | null;
  activeModalOpp: Opportunity | null;
  openWorkspaceModal: (opportunity: Opportunity) => void;
  closeWorkspaceModal: () => void;
  getApplicationByOppId: (oppId: string) => ApplicationRecord | undefined;
  createApplication: (opportunity: Opportunity, initialStatus?: ApplicationStatus) => Promise<ApplicationRecord>;
  updateApplication: (id: string, updates: Partial<ApplicationRecord>) => Promise<ApplicationRecord>;
  updateStatus: (id: string, newStatus: ApplicationStatus) => Promise<ApplicationRecord>;
  archiveApplication: (id: string) => Promise<ApplicationRecord>;
  deleteApplication: (id: string) => Promise<void>;
  clearError: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, supabaseUser } = useAuth();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModalOpp, setActiveModalOpp] = useState<Opportunity | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const mapRowToRecord = useCallback((row: ApplicationRow): ApplicationRecord => {
    const rawSnapshot = (row.opportunity_snapshot || {}) as Record<string, unknown>;
    const checklist: ChecklistItem[] = Array.isArray(rawSnapshot.checklist)
      ? (rawSnapshot.checklist as ChecklistItem[])
      : getDefaultChecklist();

    const oppOnly = { ...rawSnapshot };
    delete oppOnly.checklist;

    return {
      id: row.id,
      userId: row.user_id,
      opportunityId: row.opportunity_id,
      opportunitySnapshot: oppOnly as unknown as Opportunity,
      status: row.status,
      notes: row.notes || '',
      nextAction: row.next_action || '',
      nextActionAt: row.next_action_at || null,
      submittedAt: row.submitted_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      checklist
    };
  }, []);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      const guestApps = loadGuestApplications();
      setApplications(guestApps);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('updated_at', { ascending: false });

      if (fetchErr) {
        console.error('[ApplicationContext] Supabase fetch error:', fetchErr);
        setError(`Failed to load applications from database: ${fetchErr.message}`);
        setApplications(loadGuestApplications());
      } else if (data) {
        const records = (data as ApplicationRow[]).map(mapRowToRecord);
        setApplications(records);
      }
    } catch (err) {
      console.error('[ApplicationContext] Unexpected fetch error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown network error loading applications';
      setError(msg);
      setApplications(loadGuestApplications());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, supabaseUser, mapRowToRecord]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const openWorkspaceModal = useCallback((opportunity: Opportunity) => {
    setActiveModalOpp(opportunity);
  }, []);

  const closeWorkspaceModal = useCallback(() => {
    setActiveModalOpp(null);
  }, []);

  const getApplicationByOppId = useCallback(
    (oppId: string): ApplicationRecord | undefined => {
      return applications.find(app => app.opportunityId === oppId);
    },
    [applications]
  );

  const createApplication = async (
    opportunity: Opportunity,
    initialStatus: ApplicationStatus = 'saved'
  ): Promise<ApplicationRecord> => {
    const existing = getApplicationByOppId(opportunity.id);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const userId = supabaseUser?.id || 'guest-user';

    const newRecord: ApplicationRecord = {
      id: newId,
      userId,
      opportunityId: opportunity.id,
      opportunitySnapshot: opportunity,
      status: initialStatus,
      notes: '',
      nextAction: '',
      nextActionAt: null,
      submittedAt: initialStatus === 'submitted' ? now : null,
      createdAt: now,
      updatedAt: now,
      checklist: getDefaultChecklist()
    };

    const previousApps = applications;
    setApplications(prev => [newRecord, ...prev]);

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      upsertGuestApplication(newRecord);
      return newRecord;
    }

    try {
      const payload = {
        id: newRecord.id,
        user_id: newRecord.userId,
        opportunity_id: newRecord.opportunityId,
        opportunity_snapshot: {
          ...opportunity,
          checklist: newRecord.checklist
        },
        status: newRecord.status,
        notes: newRecord.notes,
        next_action: newRecord.nextAction,
        next_action_at: newRecord.nextActionAt,
        submitted_at: newRecord.submittedAt,
        created_at: newRecord.createdAt,
        updated_at: newRecord.updatedAt
      };

      const { data, error: insertErr } = await supabase
        .from('applications')
        .insert(payload)
        .select('*')
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      if (data) {
        const createdRecord = mapRowToRecord(data as ApplicationRow);
        setApplications(prev => prev.map(app => (app.id === newId ? createdRecord : app)));
        return createdRecord;
      }
      return newRecord;
    } catch (err) {
      setApplications(previousApps);
      const errMsg = err instanceof Error ? err.message : 'Failed to save application to server';
      setError(`Persistence error: ${errMsg}`);
      throw err;
    }
  };

  const updateApplication = async (
    id: string,
    updates: Partial<ApplicationRecord>
  ): Promise<ApplicationRecord> => {
    const target = applications.find(app => app.id === id);
    if (!target) {
      throw new Error(`Application with ID "${id}" not found.`);
    }

    if (updates.opportunityId && isDuplicateApplication(applications, updates.opportunityId, id)) {
      const errMsg = 'An active application for this opportunity already exists.';
      setError(errMsg);
      throw new Error(errMsg);
    }

    const now = new Date().toISOString();

    let updatedSubmittedAt = updates.submittedAt !== undefined ? updates.submittedAt : target.submittedAt;
    if (updates.status === 'submitted' && target.status !== 'submitted' && !updatedSubmittedAt) {
      updatedSubmittedAt = now;
    }

    const updatedRecord: ApplicationRecord = {
      ...target,
      ...updates,
      submittedAt: updatedSubmittedAt,
      updatedAt: now
    };

    const previousApps = applications;
    setApplications(prev => prev.map(app => (app.id === id ? updatedRecord : app)));

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      upsertGuestApplication(updatedRecord);
      return updatedRecord;
    }

    try {
      const payload = {
        opportunity_snapshot: {
          ...updatedRecord.opportunitySnapshot,
          checklist: updatedRecord.checklist
        },
        status: updatedRecord.status,
        notes: updatedRecord.notes,
        next_action: updatedRecord.nextAction,
        next_action_at: updatedRecord.nextActionAt,
        submitted_at: updatedRecord.submittedAt,
        updated_at: now
      };

      const { data, error: updateErr } = await supabase
        .from('applications')
        .update(payload)
        .eq('id', id)
        .eq('user_id', supabaseUser.id)
        .select('*')
        .single();

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      if (data) {
        const persisted = mapRowToRecord(data as ApplicationRow);
        setApplications(prev => prev.map(app => (app.id === id ? persisted : app)));
        return persisted;
      }
      return updatedRecord;
    } catch (err) {
      setApplications(previousApps);
      const errMsg = err instanceof Error ? err.message : 'Failed to update application on server';
      setError(`Persistence error: ${errMsg}`);
      throw err;
    }
  };

  const updateStatus = async (id: string, newStatus: ApplicationStatus): Promise<ApplicationRecord> => {
    return updateApplication(id, { status: newStatus });
  };

  const archiveApplication = async (id: string): Promise<ApplicationRecord> => {
    return updateApplication(id, { status: 'archived' });
  };

  const deleteApplication = async (id: string): Promise<void> => {
    const target = applications.find(app => app.id === id);
    if (!target) return;

    const previousApps = applications;
    setApplications(prev => prev.filter(app => app.id !== id));

    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      deleteGuestApplication(id);
      return;
    }

    try {
      const { error: delErr } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', supabaseUser.id);

      if (delErr) {
        throw new Error(delErr.message);
      }
    } catch (err) {
      setApplications(previousApps);
      const errMsg = err instanceof Error ? err.message : 'Failed to delete application from server';
      setError(`Persistence error: ${errMsg}`);
      throw err;
    }
  };

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        isLoading,
        error,
        activeModalOpp,
        openWorkspaceModal,
        closeWorkspaceModal,
        getApplicationByOppId,
        createApplication,
        updateApplication,
        updateStatus,
        archiveApplication,
        deleteApplication,
        clearError
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplications must be used within an ApplicationProvider');
  }
  return context;
};
