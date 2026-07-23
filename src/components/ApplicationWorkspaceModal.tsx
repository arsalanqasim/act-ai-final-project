import React, { useState, useEffect } from 'react';
import { useApplications } from '../context/ApplicationContext';
import { ApplicationStatus, ChecklistItem, ApplicationRecord } from '../types';
import { STATUS_CONFIGS, ALL_APPLICATION_STATUSES } from '../features/applications/utils';
import { getDeadlineStatus } from '../utils/dateUtils';
import {
  X,
  Calendar,
  MapPin,
  DollarSign,
  ExternalLink,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Archive,
  Save,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  Info
} from 'lucide-react';

export const ApplicationWorkspaceModal: React.FC = () => {
  const {
    activeModalOpp,
    closeWorkspaceModal,
    getApplicationByOppId,
    createApplication,
    updateApplication,
    archiveApplication,
    deleteApplication,
    error,
    clearError
  } = useApplications();

  const [currentApp, setCurrentApp] = useState<ApplicationRecord | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>('saved');
  const [notes, setNotes] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [nextActionAt, setNextActionAt] = useState<string>('');
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!activeModalOpp) {
      setCurrentApp(null);
      return;
    }

    const existing = getApplicationByOppId(activeModalOpp.id);
    if (existing) {
      setCurrentApp(existing);
      setStatus(existing.status);
      setNotes(existing.notes || '');
      setNextAction(existing.nextAction || '');
      setNextActionAt(existing.nextActionAt ? existing.nextActionAt.split('T')[0] : '');
      setSubmittedAt(existing.submittedAt ? existing.submittedAt.split('T')[0] : '');
      setChecklist(existing.checklist || []);
    } else {
      setCurrentApp(null);
      setStatus('saved');
      setNotes('');
      setNextAction('');
      setNextActionAt('');
      setSubmittedAt('');
      setChecklist([
        { id: 'check-1', label: 'Review eligibility & deadline details', completed: false },
        { id: 'check-2', label: 'Tailor CV / Resume for opportunity', completed: false },
        { id: 'check-3', label: 'Generate Copilot pitch or cover letter', completed: false },
        { id: 'check-4', label: 'Prepare required portfolio / repository links', completed: false },
        { id: 'check-5', label: 'Submit official application form', completed: false }
      ]);
    }
    setSaveSuccessMsg(null);
  }, [activeModalOpp, getApplicationByOppId]);

  if (!activeModalOpp) return null;

  const deadlineAnalysis = getDeadlineStatus(activeModalOpp.deadline);

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setStatus(newStatus);
    if (newStatus === 'submitted' && !submittedAt) {
      setSubmittedAt(new Date().toISOString().split('T')[0]);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom-check-${Date.now()}`,
      label: newChecklistItem.trim(),
      completed: false
    };
    setChecklist(prev => [...prev, newItem]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setSaveSuccessMsg(null);
    clearError();

    try {
      if (currentApp) {
        const updated = await updateApplication(currentApp.id, {
          status,
          notes,
          nextAction,
          nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : null,
          submittedAt: submittedAt ? new Date(submittedAt).toISOString() : null,
          checklist
        });
        setCurrentApp(updated);
      } else {
        const created = await createApplication(activeModalOpp, status);
        const fullRecord = await updateApplication(created.id, {
          notes,
          nextAction,
          nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : null,
          submittedAt: submittedAt ? new Date(submittedAt).toISOString() : null,
          checklist
        });
        setCurrentApp(fullRecord);
      }

      setSaveSuccessMsg('Application changes saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save application workspace:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!currentApp) return;
    setIsSubmitting(true);
    try {
      const archived = await archiveApplication(currentApp.id);
      setCurrentApp(archived);
      setStatus('archived');
      setSaveSuccessMsg('Application archived');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to archive application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentApp) return;
    if (!window.confirm('Are you sure you want to delete this application tracking record?')) return;

    setIsSubmitting(true);
    try {
      await deleteApplication(currentApp.id);
      closeWorkspaceModal();
    } catch (err) {
      console.error('Failed to delete application:', err);
      setIsSubmitting(false);
    }
  };

  const completedChecklistCount = checklist.filter(c => c.completed).length;
  const checklistProgressPercent = checklist.length > 0 ? Math.round((completedChecklistCount / checklist.length) * 100) : 0;

  return (
    <div
      id="app-workspace-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
      role="presentation"
    >
      <div
        id="app-workspace-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-workspace-title"
        className="glass-panel relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700/80 bg-[#0B0F19]/95 text-slate-100 shadow-2xl overflow-hidden my-8"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Application Workspace
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  {activeModalOpp.category}
                </span>
              </div>
              <h2 id="application-workspace-title" className="font-['Outfit'] text-xl font-bold text-white line-clamp-1">
                {activeModalOpp.title}
              </h2>
            </div>
          </div>

          <button
            id="btn-close-app-workspace"
            onClick={closeWorkspaceModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-white transition-colors"
            title="Close workspace"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center justify-between rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
              <button
                id="app-btn-dismiss-error"
                onClick={clearError}
                className="text-red-400 hover:text-red-200 underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">{activeModalOpp.organization}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                  Deadline: <strong className={deadlineAnalysis.isExpired ? 'text-red-400' : 'text-slate-200'}>{deadlineAnalysis.formattedDate}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                  {activeModalOpp.location}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <DollarSign className="h-3.5 w-3.5" />
                  {activeModalOpp.stipendOrPrize}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                deadlineAnalysis.isExpired
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : deadlineAnalysis.status === 'Closing soon'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {deadlineAnalysis.status}
              </span>

              <a
                id="link-app-workspace-apply"
                href={activeModalOpp.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <span>Apply Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Application Lifecycle Status</span>
              </label>
              <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CONFIGS[status].badgeStyle}`}>
                {STATUS_CONFIGS[status].label}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
              {ALL_APPLICATION_STATUSES.map((st) => {
                const cfg = STATUS_CONFIGS[st];
                const isActive = status === st;
                return (
                  <button
                    key={st}
                    id={`btn-app-status-${st}`}
                    onClick={() => handleStatusChange(st)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold shadow-lg shadow-cyan-500/10'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                    title={cfg.description}
                  >
                    <span className="text-[10px] font-mono text-slate-500 mb-0.5">Step {cfg.stepNumber}</span>
                    <span className="text-xs font-semibold truncate w-full">{cfg.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-xs text-slate-400">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Marking an application as <em>Submitted</em> tracks your personal career progress within OpportunityPulse AI. It does <strong>not</strong> automate external website form submissions.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2 flex flex-col">
              <label htmlFor="app-notes-textarea" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Application Notes & Pitch Draft</span>
              </label>
              <textarea
                id="app-notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste key response requirements, interviewer contact details, customized pitch ideas, or follow-up notes here..."
                rows={7}
                className="w-full flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="app-next-action-input" className="text-xs font-semibold text-slate-300">
                  Next Action Task
                </label>
                <input
                  id="app-next-action-input"
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="e.g. Follow up on portal status / Send recommendations"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="app-next-action-date" className="text-xs font-semibold text-slate-300">
                  Next Action Due Date
                </label>
                <input
                  id="app-next-action-date"
                  type="date"
                  value={nextActionAt}
                  onChange={(e) => setNextActionAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="app-submitted-at-date" className="text-xs font-semibold text-slate-300">
                  User Submission Date
                </label>
                <input
                  id="app-submitted-at-date"
                  type="date"
                  value={submittedAt}
                  onChange={(e) => setSubmittedAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-800/80 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                  <span>Application Preparation Checklist</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {completedChecklistCount} of {checklist.length} tasks completed ({checklistProgressPercent}%)
                </p>
              </div>

              <div className="w-32 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${checklistProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 transition-colors hover:border-slate-700"
                >
                  <button
                    id={`app-checklist-item-${item.id}`}
                    onClick={() => toggleChecklistItem(item.id)}
                    className="flex items-center gap-2.5 text-xs text-slate-200 hover:text-white text-left flex-1"
                  >
                    {item.completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                    <span className={item.completed ? 'line-through text-slate-500' : ''}>
                      {item.label}
                    </span>
                  </button>

                  <button
                    id={`app-btn-remove-checklist-${item.id}`}
                    onClick={() => removeChecklistItem(item.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="app-add-checklist-input"
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                placeholder="Add custom preparation task..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                id="app-btn-add-checklist"
                onClick={addChecklistItem}
                className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 text-xs font-semibold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Task
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 px-6 py-4 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentApp && (
              <>
                <button
                  id="app-btn-archive"
                  onClick={handleArchive}
                  disabled={isSubmitting || status === 'archived'}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Archive</span>
                </button>

                <button
                  id="app-btn-delete"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Record</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="app-btn-cancel"
              onClick={closeWorkspaceModal}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              id="app-btn-save"
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Application'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
