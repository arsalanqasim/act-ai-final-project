import React from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';

interface LoadingFallbackProps {
  label?: string;
  compact?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  label = 'Loading workspace…',
  compact = false,
}) => (
  <div
    id="deferred-feature-loading"
    role="status"
    aria-live="polite"
    className={`glass-panel flex items-center justify-center gap-3 rounded-2xl border border-cyan-500/20 bg-[#0B0F19]/95 text-cyan-200 shadow-2xl ${compact ? 'p-5' : 'min-h-[180px] p-8'}`}
  >
    <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" aria-hidden="true" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export const FeedSkeleton: React.FC = () => (
  <div id="feed-loading-skeleton" role="status" aria-label="Loading opportunities" className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }, (_, index) => (
      <div key={index} className="glass-panel animate-pulse rounded-2xl p-5" aria-hidden="true">
        <div className="flex justify-between gap-3">
          <div className="h-6 w-28 rounded-lg bg-slate-800" />
          <div className="h-8 w-8 rounded-lg bg-slate-800" />
        </div>
        <div className="mt-5 h-5 w-4/5 rounded bg-slate-800" />
        <div className="mt-2 h-3 w-2/5 rounded bg-slate-800" />
        <div className="mt-4 h-10 rounded-xl bg-slate-800" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-slate-800" />
          <div className="h-3 w-5/6 rounded bg-slate-800" />
        </div>
        <div className="mt-6 h-8 rounded-xl bg-slate-800" />
      </div>
    ))}
    <span className="sr-only">Loading opportunity cards</span>
  </div>
);

export const PanelSkeleton: React.FC<{ label?: string }> = ({ label = 'Loading panel' }) => (
  <div id="panel-loading-skeleton" role="status" aria-label={label} className="glass-panel animate-pulse rounded-2xl p-5">
    <div className="flex items-center gap-3">
      <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden="true" />
      <div className="h-4 w-40 rounded bg-slate-800" />
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="h-16 rounded-xl bg-slate-800" />
      <div className="h-16 rounded-xl bg-slate-800" />
      <div className="h-16 rounded-xl bg-slate-800" />
    </div>
    <span className="sr-only">{label}</span>
  </div>
);
