import React, { lazy, Suspense, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, Zap, Bookmark, CheckCircle2, BarChart3, Sparkles } from 'lucide-react';
import { LoadingFallback } from './LoadingFallback';

const InsightsDashboardModal = lazy(() => import('./InsightsDashboardModal').then(module => ({ default: module.InsightsDashboardModal })));

export const StatsOverview: React.FC = () => {
  const { opportunities, matchResults, savedIds } = useApp();
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const totalOpps = opportunities.length;
  const savedCount = savedIds.length;

  // Calculate average match score
  const scores = Object.values(matchResults).map(r => r.score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
  const highMatchCount = scores.filter(s => s >= 80).length;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-3">
        {/* Header Action Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
            <span>Opportunity Pipeline Overview</span>
          </div>

          <button
            id="btn-open-decision-insights"
            onClick={() => setIsInsightsOpen(true)}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-50 to-indigo-50 hover:from-cyan-100 hover:to-indigo-100 border border-cyan-200 px-3.5 py-1.5 text-xs font-semibold text-cyan-700 transition-all shadow-sm"
          >
            <BarChart3 className="h-4 w-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            <span>View Decision Analytics</span>
          </button>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">

          {/* Total Opportunities Card */}
          <div
            onClick={() => setIsInsightsOpen(true)}
            className="bg-white border border-slate-200 cursor-pointer rounded-2xl p-4 transition-all hover:border-cyan-300 shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Radar Coverage</span>
              <Award className="h-4 w-4 text-cyan-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-['Outfit'] text-2xl font-bold text-slate-900 sm:text-3xl">{totalOpps}</span>
              <span className="text-xs text-slate-500">active items</span>
            </div>
          </div>

          {/* High Match Count */}
          <div
            onClick={() => setIsInsightsOpen(true)}
            className="bg-white border border-slate-200 cursor-pointer rounded-2xl p-4 transition-all hover:border-emerald-300 shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">🔥 High Match Fit</span>
              <Zap className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-['Outfit'] text-2xl font-bold text-emerald-600 sm:text-3xl">{highMatchCount}</span>
              <span className="text-xs text-slate-500">&ge;80% score</span>
            </div>
          </div>

          {/* Avg Match Score */}
          <div
            onClick={() => setIsInsightsOpen(true)}
            className="bg-white border border-slate-200 cursor-pointer rounded-2xl p-4 transition-all hover:border-indigo-300 shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Profile Compatibility</span>
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-['Outfit'] text-2xl font-bold text-indigo-600 sm:text-3xl">{avgScore}%</span>
              <span className="text-xs text-slate-500">avg fit index</span>
            </div>
          </div>

          {/* Saved Count */}
          <div
            onClick={() => setIsInsightsOpen(true)}
            className="bg-white border border-slate-200 cursor-pointer rounded-2xl p-4 transition-all hover:border-purple-300 shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Saved Items</span>
              <Bookmark className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-['Outfit'] text-2xl font-bold text-purple-600 sm:text-3xl">{savedCount}</span>
              <span className="text-xs text-slate-500">bookmarked</span>
            </div>
          </div>

        </div>
      </div>

      {/* Decision Insights Modal */}
      {isInsightsOpen && <Suspense fallback={<div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"><LoadingFallback label="Loading decision analytics…" /></div>}><InsightsDashboardModal isOpen onClose={() => setIsInsightsOpen(false)} /></Suspense>}
    </>
  );
};
