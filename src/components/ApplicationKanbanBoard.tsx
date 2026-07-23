import React, { useState, useCallback } from 'react';
import { useApplications } from '../context/ApplicationContext';
import { useApp } from '../context/AppContext';
import type { ApplicationRecord, ApplicationStatus } from '../types';
import { STATUS_CONFIGS, ALL_APPLICATION_STATUSES } from '../features/applications/utils';
import { getDeadlineStatus } from '../utils/dateUtils';
import { ActionTaskModal } from './ActionTaskModal';
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Plus,
  ExternalLink,
  Inbox,
} from 'lucide-react';

interface KanbanCardProps {
  app: ApplicationRecord;
  columnStatus: ApplicationStatus;
  onMoveLeft: (app: ApplicationRecord) => void;
  onMoveRight: (app: ApplicationRecord) => void;
  onOpenWorkspace: (app: ApplicationRecord) => void;
  onCreateTask: (app: ApplicationRecord) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  app,
  columnStatus: _columnStatus,
  onMoveLeft,
  onMoveRight,
  onOpenWorkspace,
  onCreateTask,
  canMoveLeft,
  canMoveRight,
}) => {
  const deadline = getDeadlineStatus(app.opportunitySnapshot?.deadline);
  const opp = app.opportunitySnapshot;

  return (
    <div
      id={`kanban-card-${app.id}`}
      className="group rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 transition-all hover:border-slate-700 hover:bg-slate-900/80 focus-within:border-cyan-500/50"
    >
      {/* Opportunity title */}
      <button
        id={`kanban-card-open-${app.id}`}
        onClick={() => onOpenWorkspace(app)}
        className="w-full text-left text-xs font-semibold text-slate-200 hover:text-white transition-colors line-clamp-2"
        title={`Open workspace for ${opp?.title}`}
      >
        {opp?.title ?? 'Unknown Opportunity'}
      </button>

      {/* Org & deadline */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="truncate">{opp?.organization ?? '—'}</span>
        {deadline.daysRemaining !== null && (
          <span
            className={`shrink-0 flex items-center gap-0.5 ${
              deadline.isExpired
                ? 'text-red-400'
                : deadline.status === 'Closing soon'
                ? 'text-amber-400'
                : 'text-slate-500'
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            {deadline.isExpired
              ? 'Expired'
              : deadline.daysRemaining === 0
              ? 'Today'
              : `${deadline.daysRemaining}d`}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 pt-1">
        <button
          id={`kanban-move-left-${app.id}`}
          onClick={() => onMoveLeft(app)}
          disabled={!canMoveLeft}
          aria-label={`Move ${opp?.title ?? 'application'} to previous status`}
          title="Move to previous stage"
          className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-200 hover:border-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>

        <button
          id={`kanban-move-right-${app.id}`}
          onClick={() => onMoveRight(app)}
          disabled={!canMoveRight}
          aria-label={`Move ${opp?.title ?? 'application'} to next status`}
          title="Move to next stage"
          className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-200 hover:border-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-3 w-3" />
        </button>

        <button
          id={`kanban-add-task-${app.id}`}
          onClick={() => onCreateTask(app)}
          aria-label={`Add task for ${opp?.title ?? 'application'}`}
          title="Add action task"
          className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>

        {opp?.applyUrl && (
          <a
            id={`kanban-apply-link-${app.id}`}
            href={opp.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open apply portal for ${opp?.title ?? 'application'}`}
            title="Open apply portal"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/40 transition-colors ml-auto"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
};

// Group applications by status, sorted by deadline urgency
function groupByStatus(apps: ApplicationRecord[]): Record<ApplicationStatus, ApplicationRecord[]> {
  const groups: Record<ApplicationStatus, ApplicationRecord[]> = {
    saved: [],
    researching: [],
    drafting: [],
    ready_to_submit: [],
    submitted: [],
    interview: [],
    offer: [],
    rejected: [],
    archived: [],
  };
  for (const app of apps) {
    groups[app.status].push(app);
  }
  // Sort each column by deadline urgency
  for (const status of ALL_APPLICATION_STATUSES) {
    groups[status].sort((a, b) => {
      const da = getDeadlineStatus(a.opportunitySnapshot?.deadline).daysRemaining;
      const db = getDeadlineStatus(b.opportunitySnapshot?.deadline).daysRemaining;
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }
  return groups;
}

export const ApplicationKanbanBoard: React.FC = () => {
  const { applications, updateStatus, openWorkspaceModal } = useApplications();
  const { opportunities } = useApp();
  const [taskModalApp, setTaskModalApp] = useState<ApplicationRecord | null>(null);

  const grouped = groupByStatus(applications);

  const handleMoveLeft = useCallback(
    async (app: ApplicationRecord) => {
      const currentIdx = ALL_APPLICATION_STATUSES.indexOf(app.status);
      if (currentIdx <= 0) return;
      const newStatus = ALL_APPLICATION_STATUSES[currentIdx - 1];
      try {
        await updateStatus(app.id, newStatus);
      } catch (err) {
        console.error('Failed to move application left:', err);
      }
    },
    [updateStatus]
  );

  const handleMoveRight = useCallback(
    async (app: ApplicationRecord) => {
      const currentIdx = ALL_APPLICATION_STATUSES.indexOf(app.status);
      if (currentIdx >= ALL_APPLICATION_STATUSES.length - 1) return;
      const newStatus = ALL_APPLICATION_STATUSES[currentIdx + 1];
      try {
        await updateStatus(app.id, newStatus);
      } catch (err) {
        console.error('Failed to move application right:', err);
      }
    },
    [updateStatus]
  );

  const handleOpenWorkspace = useCallback(
    (app: ApplicationRecord) => {
      const opp = opportunities.find((o) => o.id === app.opportunityId) ?? app.opportunitySnapshot;
      openWorkspaceModal(opp);
    },
    [opportunities, openWorkspaceModal]
  );

  const handleCreateTask = useCallback((app: ApplicationRecord) => {
    setTaskModalApp(app);
  }, []);

  return (
    <div
      id="application-kanban-board"
      className="overflow-x-auto pb-4"
      aria-label="Application Kanban board"
    >
      <div className="flex gap-3 min-w-max">
        {ALL_APPLICATION_STATUSES.map((status) => {
          const cfg = STATUS_CONFIGS[status];
          const cards = grouped[status];
          const currentIdx = ALL_APPLICATION_STATUSES.indexOf(status);

          return (
            <div
              key={status}
              id={`kanban-column-${status}`}
              className="w-52 shrink-0 flex flex-col gap-2"
              aria-label={`${cfg.label} column`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badgeStyle}`}>
                  {cfg.shortLabel}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[80px]">
                {cards.length === 0 ? (
                  <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-slate-800 text-slate-600">
                    <Inbox className="h-4 w-4" />
                  </div>
                ) : (
                  cards.map((app) => (
                    <KanbanCard
                      key={app.id}
                      app={app}
                      columnStatus={status}
                      onMoveLeft={handleMoveLeft}
                      onMoveRight={handleMoveRight}
                      onOpenWorkspace={handleOpenWorkspace}
                      onCreateTask={handleCreateTask}
                      canMoveLeft={currentIdx > 0}
                      canMoveRight={currentIdx < ALL_APPLICATION_STATUSES.length - 1}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task creation modal */}
      {taskModalApp && (
        <ActionTaskModal
          isOpen={!!taskModalApp}
          onClose={() => setTaskModalApp(null)}
          applicationId={taskModalApp.id}
          opportunityId={taskModalApp.opportunityId}
          opportunityTitle={taskModalApp.opportunitySnapshot?.title}
        />
      )}
    </div>
  );
};
