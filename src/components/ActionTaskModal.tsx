import React, { useState, useCallback } from 'react';
import { useActionTasks } from '../context/ActionTaskContext';
import type { ActionPriority, ActionTask } from '../types';
import {
  X,
  Calendar,
  Flag,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface ActionTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string | null;
  opportunityId?: string | null;
  opportunityTitle?: string;
  existingTask?: ActionTask | null;
}

const PRIORITY_OPTIONS: { value: ActionPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-slate-400 bg-slate-800 border-slate-700' },
  { value: 'medium', label: 'Medium', color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' },
  { value: 'high', label: 'High', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-300 bg-red-500/10 border-red-500/30' },
];

export const ActionTaskModal: React.FC<ActionTaskModalProps> = ({
  isOpen,
  onClose,
  applicationId = null,
  opportunityId = null,
  opportunityTitle,
  existingTask = null,
}) => {
  const { createTask, updateTask, clearError } = useActionTasks();

  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');
  const [priority, setPriority] = useState<ActionPriority>(existingTask?.priority ?? 'medium');
  const [dueAt, setDueAt] = useState(
    existingTask?.dueAt ? existingTask.dueAt.split('T')[0] : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    if (!existingTask) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueAt('');
    }
    setSubmitError(null);
    setSuccessMsg(null);
  }, [existingTask]);

  const handleClose = () => {
    resetForm();
    clearError();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (existingTask) {
        await updateTask(existingTask.id, {
          title,
          description,
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        });
        setSuccessMsg('Task updated successfully!');
      } else {
        await createTask({
          title,
          description,
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          applicationId,
          opportunityId,
        });
        setSuccessMsg('Task created successfully!');
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueAt('');
      }
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save task';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="action-task-modal-overlay"
      role="presentation"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        id="action-task-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-task-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#0B0F19] shadow-2xl text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2
              id="action-task-modal-title"
              className="font-['Outfit'] text-base font-bold text-white"
            >
              {existingTask ? 'Edit Action Task' : 'New Action Task'}
            </h2>
            {opportunityTitle && (
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                Linked to: {opportunityTitle}
              </p>
            )}
          </div>
          <button
            id="btn-close-action-task-modal"
            onClick={handleClose}
            aria-label="Close task modal"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Form */}
        <form id="action-task-form" onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Live feedback */}
          {submitError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-xs text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}
          {successMsg && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2.5 text-xs text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="task-title-input" className="block text-xs font-semibold text-slate-300">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Write cover letter draft"
              maxLength={500}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="task-description-input" className="block text-xs font-semibold text-slate-300">
              Details <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              id="task-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more context or notes..."
              rows={3}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Priority & Due date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="task-priority-select" className="block text-xs font-semibold text-slate-300">
                <Flag className="inline h-3.5 w-3.5 mr-1 text-indigo-400" />
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionPriority)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-due-date-input" className="block text-xs font-semibold text-slate-300">
                <Calendar className="inline h-3.5 w-3.5 mr-1 text-cyan-400" />
                Due Date
              </label>
              <input
                id="task-due-date-input"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
            <button
              id="btn-cancel-task-modal"
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-task-modal"
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? 'Saving…' : existingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
