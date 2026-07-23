import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApplications } from '../context/ApplicationContext';
import { useActionTasks } from '../context/ActionTaskContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ApplicationKanbanBoard } from './ApplicationKanbanBoard';
import { ActionTaskModal } from './ActionTaskModal';
import { NotificationHistoryPanel } from './NotificationHistoryPanel';
import { buildPrioritizedActions } from '../utils/actionPrioritization';
import { getDeadlineStatus } from '../utils/dateUtils';
import type { ActionTask, PrioritizedAction } from '../types';
import { STATUS_CONFIGS } from '../features/applications/utils';
import {
  X,
  LayoutGrid,
  CalendarDays,
  Zap,
  BarChart3,
  Bell,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Trash2,
  Pencil,
  Info,
  AlertTriangle,
  TrendingUp,
  Send,
  Award,
  AlertCircle,
  Loader2,
  RefreshCcw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'kanban' | 'timeline' | 'actions' | 'progress' | 'notifications';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'kanban', label: 'Kanban Board', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: 'timeline', label: 'Deadline Timeline', icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { id: 'actions', label: "Today's Actions", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: 'progress', label: 'Progress', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-3.5 w-3.5" /> },
];

const URGENCY_STYLES: Record<PrioritizedAction['urgency'], string> = {
  critical: 'border-red-500/40 bg-red-500/5',
  high: 'border-amber-500/40 bg-amber-500/5',
  medium: 'border-cyan-500/30 bg-cyan-500/5',
  low: 'border-slate-800 bg-slate-900/40',
};

const URGENCY_BADGE: Record<PrioritizedAction['urgency'], string> = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/40',
  high: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  medium: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  low: 'bg-slate-700 text-slate-400 border-slate-600',
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-cyan-500',
  low: 'bg-slate-500',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SectionEmpty: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
  icon,
  title,
  body,
}) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
    <span className="text-slate-600">{icon}</span>
    <p className="text-sm font-medium">{title}</p>
    <p className="text-xs text-slate-500 text-center max-w-xs">{body}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Today's Action Queue item
// ─────────────────────────────────────────────────────────────────────────────

interface ActionQueueItemProps {
  action: PrioritizedAction;
  tasks: ActionTask[];
  onComplete: (taskId: string) => void;
  onReopen: (taskId: string) => void;
  onEditTask: (task: ActionTask) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenApp: (applicationId: string) => void;
}

const ActionQueueItem: React.FC<ActionQueueItemProps> = ({
  action,
  tasks,
  onComplete,
  onReopen,
  onEditTask,
  onDeleteTask,
  onOpenApp,
}) => {
  const linkedTask = action.taskId ? tasks.find((t) => t.id === action.taskId) : null;
  const isTaskCompleted = linkedTask?.completed ?? false;

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      id={`action-queue-item-${action.id}`}
      className={`rounded-xl border p-3 space-y-2 transition-all ${URGENCY_STYLES[action.urgency]}`}
    >
      <div className="flex items-start gap-2">
        {/* Complete/reopen toggle for tasks */}
        {action.type === 'task' && action.taskId && (
          <button
            id={`btn-toggle-task-${action.taskId}`}
            onClick={() => (isTaskCompleted ? onReopen(action.taskId!) : onComplete(action.taskId!))}
            aria-label={isTaskCompleted ? 'Reopen task' : 'Complete task'}
            className={`mt-0.5 shrink-0 transition-colors ${
              isTaskCompleted ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'
            }`}
          >
            {isTaskCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${URGENCY_BADGE[action.urgency]}`}
            >
              {action.urgency}
            </span>
            <span className="text-xs font-semibold text-slate-200 line-clamp-1">
              {action.title}
            </span>
          </div>
          {action.subtitle && (
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{action.subtitle}</p>
          )}
        </div>

        {/* Task controls */}
        {action.type === 'task' && action.taskId && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              id={`btn-edit-action-task-${action.taskId}`}
              onClick={() => linkedTask && onEditTask(linkedTask)}
              aria-label="Edit task"
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
            {confirmDelete ? (
              <>
                <button
                  id={`btn-confirm-delete-task-${action.taskId}`}
                  onClick={() => onDeleteTask(action.taskId!)}
                  aria-label="Confirm delete task"
                  className="rounded-lg bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
                <button
                  id={`btn-cancel-delete-task-${action.taskId}`}
                  onClick={() => setConfirmDelete(false)}
                  aria-label="Cancel delete"
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                id={`btn-delete-action-task-${action.taskId}`}
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete task"
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Application controls */}
        {action.type === 'application' && action.applicationId && (
          <button
            id={`btn-open-app-from-queue-${action.applicationId}`}
            onClick={() => onOpenApp(action.applicationId!)}
            aria-label={`Open workspace for ${action.title}`}
            className="shrink-0 flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            Open
          </button>
        )}
      </div>

      {/* Why this is next */}
      {action.reasons.length > 0 && (
        <div className="flex items-start gap-1.5 pl-6">
          <Info className="h-3 w-3 text-slate-600 shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-1">
            {action.reasons.map((r, i) => (
              <span
                key={i}
                className="text-[10px] text-slate-500 rounded-full bg-slate-800/80 border border-slate-700/50 px-1.5 py-0.5"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────

interface CareerCommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CareerCommandCenterModal: React.FC<CareerCommandCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { applications, isLoading: appsLoading, openWorkspaceModal } = useApplications();
  const { tasks, isLoading: tasksLoading, error: tasksError, completeTask, reopenTask, deleteTask, clearError } = useActionTasks();
  const { opportunities, savedIds, matchResults } = useApp();
  const { isAuthenticated, isGuest } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('actions');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ActionTask | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap & Escape
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    dialog?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Saved opportunities (not already with an application)
  const savedOpps = useMemo(() => {
    const appOppIds = new Set(applications.map((a) => a.opportunityId));
    return opportunities.filter(
      (o) => savedIds.includes(o.id) && !appOppIds.has(o.id)
    );
  }, [opportunities, savedIds, applications]);

  // Prioritized action queue
  const prioritizedActions = useMemo(
    () =>
      buildPrioritizedActions({
        tasks: tasks.filter((t) => !t.completed),
        applications,
        savedOpportunities: savedOpps,
        matchResults,
      }),
    [tasks, applications, savedOpps, matchResults]
  );

  // Timeline: applications + saved opps ordered by deadline
  const timelineItems = useMemo(() => {
    type TimelineItem = {
      id: string;
      title: string;
      organization: string;
      deadline: string | null;
      daysLeft: number | null;
      isExpired: boolean;
      type: 'application' | 'saved';
      status?: string;
      applicationId?: string;
    };

    const items: TimelineItem[] = [];

    for (const app of applications) {
      if (['archived', 'rejected'].includes(app.status)) continue;
      const dl = getDeadlineStatus(app.opportunitySnapshot?.deadline);
      items.push({
        id: app.id,
        title: app.opportunitySnapshot?.title ?? 'Unknown',
        organization: app.opportunitySnapshot?.organization ?? '',
        deadline: app.opportunitySnapshot?.deadline ?? null,
        daysLeft: dl.daysRemaining,
        isExpired: dl.isExpired,
        type: 'application',
        status: app.status,
        applicationId: app.id,
      });
    }

    for (const opp of savedOpps) {
      const dl = getDeadlineStatus(opp.deadline);
      if (dl.isExpired) continue;
      items.push({
        id: opp.id,
        title: opp.title,
        organization: opp.organization,
        deadline: opp.deadline ?? null,
        daysLeft: dl.daysRemaining,
        isExpired: false,
        type: 'saved',
      });
    }

    // Sort: expired last, then by days ascending
    items.sort((a, b) => {
      if (a.isExpired && !b.isExpired) return 1;
      if (!a.isExpired && b.isExpired) return -1;
      if (a.daysLeft === null && b.daysLeft === null) return 0;
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return a.daysLeft - b.daysLeft;
    });

    return items;
  }, [applications, savedOpps]);

  // Progress metrics
  const metrics = useMemo(() => {
    const active = applications.filter((a) =>
      ['saved', 'researching', 'drafting', 'ready_to_submit'].includes(a.status)
    ).length;
    const submitted = applications.filter((a) => a.status === 'submitted').length;
    const interview = applications.filter((a) => a.status === 'interview').length;
    const offer = applications.filter((a) => a.status === 'offer').length;
    const total = applications.filter((a) => a.status !== 'archived').length;
    const completionRate =
      total > 0 ? Math.round(((submitted + interview + offer) / total) * 100) : 0;
    const overdueTasks = tasks.filter((t) => {
      if (t.completed || !t.dueAt) return false;
      return new Date(t.dueAt) < new Date();
    }).length;
    const pendingTasks = tasks.filter((t) => !t.completed).length;

    return { active, submitted, interview, offer, total, completionRate, overdueTasks, pendingTasks };
  }, [applications, tasks]);

  const handleOpenApp = useCallback(
    (applicationId: string) => {
      const app = applications.find((a) => a.id === applicationId);
      if (app) {
        openWorkspaceModal(app.opportunitySnapshot);
      }
    },
    [applications, openWorkspaceModal]
  );

  if (!isOpen) return null;

  const isLoading = appsLoading || tasksLoading;

  return (
    <div
      id="career-command-center-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-md overflow-y-auto"
      role="presentation"
    >
      <div
        id="career-command-center-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="career-center-title"
        tabIndex={-1}
        ref={dialogRef}
        className="relative w-full max-w-7xl min-h-screen sm:min-h-0 sm:my-6 sm:rounded-2xl border border-slate-700/80 bg-[#0B0F19] text-slate-100 shadow-2xl flex flex-col focus:outline-none"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 sm:px-6 py-4 bg-slate-900/60 sm:rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2
                id="career-center-title"
                className="font-['Outfit'] text-lg font-bold text-white"
              >
                My Career Workspace
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Manage applications, deadlines, tasks, and your progress.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGuest && (
              <span className="hidden sm:inline-block rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[10px] text-amber-300 font-medium">
                Guest — data saved locally
              </span>
            )}
            <button
              id="btn-new-task-global"
              onClick={() => { setEditingTask(null); setIsNewTaskOpen(true); }}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Task</span>
            </button>
            <button
              id="btn-close-career-center"
              onClick={onClose}
              aria-label="Close Career Workspace"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {tasksError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center justify-between gap-3 border-b border-red-500/20 bg-red-500/10 px-6 py-2.5 text-xs text-red-300 shrink-0"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {tasksError}
            </div>
            <button onClick={clearError} className="text-red-400 hover:text-red-200 font-semibold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* ── Tab Bar ── */}
        <div
          className="flex items-center gap-1 border-b border-slate-800 px-4 overflow-x-auto shrink-0 bg-slate-900/40"
          role="tablist"
          aria-label="Career workspace sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`career-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`career-tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading your career data…</span>
            </div>
          ) : (
            <>
              {/* ── Kanban ── */}
              {activeTab === 'kanban' && (
                <div
                  id="career-tabpanel-kanban"
                  role="tabpanel"
                  aria-labelledby="career-tab-kanban"
                  className="p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">Application Pipeline</h3>
                      <p className="text-xs text-slate-400">
                        {applications.length} application{applications.length !== 1 ? 's' : ''} tracked. Use ‹ › to move between stages.
                      </p>
                    </div>
                  </div>
                  {applications.length === 0 ? (
                    <SectionEmpty
                      icon={<LayoutGrid className="h-10 w-10" />}
                      title="No applications tracked yet"
                      body='Click "Track Application" on any opportunity card to start your pipeline.'
                    />
                  ) : (
                    <ApplicationKanbanBoard />
                  )}
                </div>
              )}

              {/* ── Timeline ── */}
              {activeTab === 'timeline' && (
                <div
                  id="career-tabpanel-timeline"
                  role="tabpanel"
                  aria-labelledby="career-tab-timeline"
                  className="p-4 sm:p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-200">Deadline Timeline</h3>
                    <p className="text-xs text-slate-400">Ordered by urgency. Expired opportunities are excluded.</p>
                  </div>

                  {timelineItems.length === 0 ? (
                    <SectionEmpty
                      icon={<CalendarDays className="h-10 w-10" />}
                      title="No upcoming deadlines"
                      body="Save opportunities or track applications to see deadlines here."
                    />
                  ) : (
                    <div className="space-y-2">
                      {timelineItems.map((item, idx) => {
                        const urgentDays =
                          item.daysLeft !== null && item.daysLeft <= 7 && !item.isExpired;
                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            id={`timeline-item-${idx}`}
                            className={`flex items-center gap-4 rounded-xl border p-3 transition-all ${
                              item.isExpired
                                ? 'border-red-500/20 bg-red-500/5 opacity-60'
                                : urgentDays
                                ? 'border-amber-500/30 bg-amber-500/5'
                                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                            }`}
                          >
                            {/* Day count */}
                            <div className="shrink-0 text-center w-14">
                              {item.isExpired ? (
                                <span className="text-[10px] font-bold text-red-400">EXPIRED</span>
                              ) : item.daysLeft === 0 ? (
                                <span className="text-lg font-black text-red-400">TODAY</span>
                              ) : item.daysLeft === 1 ? (
                                <span className="text-lg font-black text-amber-400">1d</span>
                              ) : item.daysLeft !== null ? (
                                <span
                                  className={`text-lg font-black ${
                                    item.daysLeft <= 7 ? 'text-amber-300' : 'text-slate-300'
                                  }`}
                                >
                                  {item.daysLeft}d
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                              <p className="text-[11px] text-slate-500 truncate">{item.organization}</p>
                            </div>

                            {/* Type badge */}
                            <div className="shrink-0">
                              {item.type === 'application' && item.status ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIGS[item.status as keyof typeof STATUS_CONFIGS]?.badgeStyle ?? ''}`}>
                                  {STATUS_CONFIGS[item.status as keyof typeof STATUS_CONFIGS]?.shortLabel}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-800 text-slate-400 border-slate-700">
                                  Saved
                                </span>
                              )}
                            </div>

                            {/* Open workspace */}
                            {item.type === 'application' && item.applicationId && (
                              <button
                                id={`timeline-open-app-${item.id}`}
                                onClick={() => handleOpenApp(item.applicationId!)}
                                aria-label={`Open workspace for ${item.title}`}
                                className="shrink-0 text-[10px] font-semibold text-slate-500 hover:text-slate-200 transition-colors"
                              >
                                Open →
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Today's Actions ── */}
              {activeTab === 'actions' && (
                <div
                  id="career-tabpanel-actions"
                  role="tabpanel"
                  aria-labelledby="career-tab-actions"
                  className="p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">Today's Action Queue</h3>
                      <p className="text-xs text-slate-400">
                        Deterministic priority based on deadlines, match scores, and task urgency. Not AI-generated.
                      </p>
                    </div>
                    <button
                      id="btn-new-task-from-actions"
                      onClick={() => { setEditingTask(null); setIsNewTaskOpen(true); }}
                      className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> New Task
                    </button>
                  </div>

                  {/* Pending task section */}
                  {tasks.filter((t) => !t.completed).length > 0 && (
                    <div className="mb-4 space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Pending Tasks ({tasks.filter((t) => !t.completed).length})
                      </h4>
                      {tasks
                        .filter((t) => !t.completed)
                        .map((task) => (
                          <div
                            key={task.id}
                            id={`task-list-item-${task.id}`}
                            className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 transition-all hover:border-slate-700"
                          >
                            <button
                              id={`btn-complete-task-${task.id}`}
                              onClick={() => completeTask(task.id).catch(console.error)}
                              aria-label={`Complete task: ${task.title}`}
                              className="mt-0.5 shrink-0 text-slate-500 hover:text-emerald-400 transition-colors"
                            >
                              <Circle className="h-4 w-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-slate-500'}`}
                                />
                                <p className="text-xs font-semibold text-slate-200 truncate">{task.title}</p>
                              </div>
                              {task.dueAt && (
                                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due {new Date(task.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                id={`btn-task-edit-inline-${task.id}`}
                                onClick={() => setEditingTask(task)}
                                aria-label="Edit task"
                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:text-cyan-400 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                id={`btn-task-delete-inline-${task.id}`}
                                onClick={() => deleteTask(task.id).catch(console.error)}
                                aria-label="Delete task"
                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Completed tasks section */}
                  {tasks.filter((t) => t.completed).length > 0 && (
                    <div className="mb-6 space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Completed ({tasks.filter((t) => t.completed).length})
                      </h4>
                      {tasks
                        .filter((t) => t.completed)
                        .slice(0, 5)
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 rounded-xl border border-slate-800/50 p-2.5 opacity-60"
                          >
                            <button
                              id={`btn-reopen-task-${task.id}`}
                              onClick={() => reopenTask(task.id).catch(console.error)}
                              aria-label={`Reopen task: ${task.title}`}
                              className="shrink-0 text-emerald-400 hover:text-slate-400 transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <p className="text-xs text-slate-500 line-through truncate">{task.title}</p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Prioritized queue (applications + saved) */}
                  {prioritizedActions.filter((a) => a.type !== 'task').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Opportunity Actions ({prioritizedActions.filter((a) => a.type !== 'task').length})
                      </h4>
                      {prioritizedActions
                        .filter((a) => a.type !== 'task')
                        .slice(0, 10)
                        .map((action) => (
                          <ActionQueueItem
                            key={action.id}
                            action={action}
                            tasks={tasks}
                            onComplete={completeTask}
                            onReopen={reopenTask}
                            onEditTask={setEditingTask}
                            onDeleteTask={(tid) => deleteTask(tid).catch(console.error)}
                            onOpenApp={handleOpenApp}
                          />
                        ))}
                    </div>
                  )}

                  {prioritizedActions.length === 0 && tasks.length === 0 && (
                    <SectionEmpty
                      icon={<Zap className="h-10 w-10" />}
                      title="Nothing to act on right now"
                      body="Save opportunities, track applications, or create manual tasks to populate your action queue."
                    />
                  )}
                </div>
              )}

              {/* ── Progress ── */}
              {activeTab === 'progress' && (
                <div
                  id="career-tabpanel-progress"
                  role="tabpanel"
                  aria-labelledby="career-tab-progress"
                  className="p-4 sm:p-6"
                >
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Progress Summary</h3>

                  {metrics.total === 0 ? (
                    <SectionEmpty
                      icon={<TrendingUp className="h-10 w-10" />}
                      title="No application data yet"
                      body="Start tracking opportunities to see your progress metrics."
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Stat cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                          { label: 'Active', value: metrics.active, icon: <Flag className="h-4 w-4 text-cyan-400" />, color: 'border-cyan-500/20' },
                          { label: 'Submitted', value: metrics.submitted, icon: <Send className="h-4 w-4 text-blue-400" />, color: 'border-blue-500/20' },
                          { label: 'Interview', value: metrics.interview, icon: <AlertTriangle className="h-4 w-4 text-purple-400" />, color: 'border-purple-500/20' },
                          { label: 'Offers', value: metrics.offer, icon: <Award className="h-4 w-4 text-emerald-400" />, color: 'border-emerald-500/20' },
                          { label: 'Pending Tasks', value: metrics.pendingTasks, icon: <Circle className="h-4 w-4 text-slate-400" />, color: 'border-slate-600' },
                          { label: 'Overdue Actions', value: metrics.overdueTasks, icon: <AlertCircle className="h-4 w-4 text-red-400" />, color: 'border-red-500/20' },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className={`rounded-xl border ${stat.color} bg-slate-900/60 p-4 flex flex-col gap-1`}
                          >
                            {stat.icon}
                            <span className="text-2xl font-black text-white">{stat.value}</span>
                            <span className="text-[11px] text-slate-400">{stat.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Completion rate */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">Application Completion Rate</span>
                          <span className="text-sm font-black text-cyan-300">{metrics.completionRate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${metrics.completionRate}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {metrics.submitted + metrics.interview + metrics.offer} of {metrics.total} applications reached submission or beyond.
                        </p>
                      </div>

                      {/* Overdue warning */}
                      {metrics.overdueTasks > 0 && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold">
                              {metrics.overdueTasks} overdue action{metrics.overdueTasks === 1 ? '' : 's'}
                            </p>
                            <p className="text-red-400/70 mt-0.5">
                              Switch to the Today's Actions tab to address them.
                            </p>
                          </div>
                          <button
                            id="btn-progress-go-to-actions"
                            onClick={() => setActiveTab('actions')}
                            className="ml-auto shrink-0 flex items-center gap-1 text-[10px] font-bold text-red-300 hover:text-red-100 transition-colors"
                          >
                            Go <RefreshCcw className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {/* Not authenticated note */}
                      {!isAuthenticated && (
                        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                          <Info className="h-3.5 w-3.5 shrink-0" />
                          Metrics are calculated from your local session. Sign in to sync across devices.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Notifications ── */}
              {activeTab === 'notifications' && (
                <div
                  id="career-tabpanel-notifications"
                  role="tabpanel"
                  aria-labelledby="career-tab-notifications"
                  className="p-4 sm:p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-200">Notification History</h3>
                    <p className="text-xs text-slate-400">
                      Read-only audit log of alert emails dispatched for your matched opportunities.
                    </p>
                  </div>
                  <NotificationHistoryPanel />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New task modal */}
      <ActionTaskModal
        isOpen={isNewTaskOpen || editingTask !== null}
        onClose={() => {
          setIsNewTaskOpen(false);
          setEditingTask(null);
        }}
        existingTask={editingTask}
      />
    </div>
  );
};
