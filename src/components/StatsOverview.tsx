import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, Zap, Bookmark, CheckCircle2 } from 'lucide-react';

export const StatsOverview: React.FC = () => {
  const { opportunities, matchResults, savedIds } = useApp();

  const totalOpps = opportunities.length;
  const savedCount = savedIds.length;

  // Calculate average match score
  const scores = Object.values(matchResults).map(r => r.score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
  const highMatchCount = scores.filter(s => s >= 80).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        
        {/* Total Opportunities Card */}
        <div className="glass-panel rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Radar Coverage</span>
            <Award className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Outfit'] text-2xl font-bold text-white sm:text-3xl">{totalOpps}</span>
            <span className="text-xs text-slate-400">active items</span>
          </div>
        </div>

        {/* High Match Count */}
        <div className="glass-panel rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">🔥 High Match Fit</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Outfit'] text-2xl font-bold text-emerald-400 sm:text-3xl">{highMatchCount}</span>
            <span className="text-xs text-slate-400">≥80% score</span>
          </div>
        </div>

        {/* Avg Match Score */}
        <div className="glass-panel rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Profile Compatibility</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Outfit'] text-2xl font-bold text-indigo-300 sm:text-3xl">{avgScore}%</span>
            <span className="text-xs text-slate-400">avg fit index</span>
          </div>
        </div>

        {/* Saved Count */}
        <div className="glass-panel rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Saved Items</span>
            <Bookmark className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Outfit'] text-2xl font-bold text-purple-300 sm:text-3xl">{savedCount}</span>
            <span className="text-xs text-slate-400">bookmarked</span>
          </div>
        </div>

      </div>
    </div>
  );
};
