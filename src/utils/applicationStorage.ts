import { ApplicationRecord } from '../types';

const GUEST_APPLICATIONS_KEY = 'opp_pulse_applications_v1';

export function loadGuestApplications(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(GUEST_APPLICATIONS_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[applicationStorage] Guest data is not an array. Resetting.');
      return [];
    }

    return parsed.filter((item): item is ApplicationRecord => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.opportunityId === 'string' &&
        typeof item.status === 'string' &&
        item.opportunitySnapshot &&
        typeof item.opportunitySnapshot === 'object'
      );
    }).map(app => ({
      ...app,
      notes: app.notes || '',
      nextAction: app.nextAction || '',
      nextActionAt: app.nextActionAt || null,
      submittedAt: app.submittedAt || null,
      checklist: Array.isArray(app.checklist) ? app.checklist : []
    }));
  } catch (err) {
    console.error('[applicationStorage] Error reading guest applications from localStorage:', err);
    return [];
  }
}

export function saveGuestApplications(apps: ApplicationRecord[]): void {
  try {
    localStorage.setItem(GUEST_APPLICATIONS_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error('[applicationStorage] Error saving guest applications to localStorage:', err);
  }
}

export function getGuestApplicationByOppId(opportunityId: string): ApplicationRecord | null {
  const apps = loadGuestApplications();
  return apps.find(app => app.opportunityId === opportunityId) || null;
}

export function upsertGuestApplication(app: ApplicationRecord): ApplicationRecord[] {
  const current = loadGuestApplications();
  const index = current.findIndex(item => item.id === app.id || item.opportunityId === app.opportunityId);

  let updated: ApplicationRecord[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...app, updatedAt: new Date().toISOString() };
  } else {
    updated = [app, ...current];
  }

  saveGuestApplications(updated);
  return updated;
}

export function deleteGuestApplication(id: string): ApplicationRecord[] {
  const current = loadGuestApplications();
  const updated = current.filter(item => item.id !== id);
  saveGuestApplications(updated);
  return updated;
}
