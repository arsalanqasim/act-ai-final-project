import React from 'react';
import { Opportunity, MatchResult } from '../types';
import { useApp } from '../context/AppContext';
import { getDeadlineStatus } from '../utils/dateUtils';
import { Calendar, MapPin, DollarSign, Bookmark, Sparkles, ExternalLink, Check, ShieldCheck, Globe, AlertCircle } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  matchResult?: MatchResult;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, matchResult }) => {
  const { savedIds, toggleSaveOpportunity, setCopilotOpp } = useApp();
  const isSaved = savedIds.includes(opportunity.id);

  const score = matchResult?.score ?? 75;
  const verdict = matchResult?.verdict ?? 'Good Match';
  const matchingSkills = matchResult?.matchingSkills ?? [];

  const deadlineAnalysis = getDeadlineStatus(opportunity.deadline);
  const hasActionableApplyUrl = (() => {
    try {
      return new URL(opportunity.applyUrl).protocol === 'https:' && !opportunity.applyUrl.includes('.invalid/');
    } catch {
      return false;
    }
  })();

  // Match score color badge logic
  const getBadgeStyle = (s: number) => {
    if (s >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (s >= 65) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    if (s >= 45) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    return 'bg-slate-700/50 text-slate-400 border-slate-600';
  };

  // Category Badge color
  const getCategoryColor = (cat: Opportunity['category']) => {
    switch (cat) {
      case 'Hackathon': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Scholarship': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Internship': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Grant': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-700';
    }
  };

  return (
    <div 
      id={`opp-card-${opportunity.id}`}
      className={`glass-panel glass-panel-hover flex flex-col justify-between rounded-2xl p-5 relative overflow-hidden group ${
        deadlineAnalysis.isExpired ? 'opacity-75 border-slate-800' : ''
      }`}
    >
      
      {/* Top Row: Category, Verification Pill & Save Bookmark */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category Tag */}
            <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getCategoryColor(opportunity.category)}`}>
              {opportunity.category}
            </span>

            {/* Verification State Badge */}
            {opportunity.verificationState === 'source-confirmed' ? (
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> {opportunity.trustLabel || 'Verified Source'}
              </span>
            ) : deadlineAnalysis.isExpired ? (
              <span className="rounded-lg bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[11px] font-bold text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Expired
              </span>
            ) : (
              <span className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300 flex items-center gap-1">
                <Globe className="h-3 w-3 text-slate-400" /> {opportunity.trustLabel || 'Community'}
              </span>
            )}

            {/* Featured Badge */}
            {opportunity.featured && (
              <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            )}
          </div>

          {/* Bookmark Save Button */}
          <button
            id={`btn-bookmark-${opportunity.id}`}
            onClick={() => toggleSaveOpportunity(opportunity.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              isSaved 
                ? 'border-purple-500/40 bg-purple-500/20 text-purple-300' 
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
            title={isSaved ? 'Remove from Bookmarks' : 'Save Opportunity'}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-purple-400' : ''}`} />
          </button>

        </div>

        {/* Opportunity Title & Organization */}
        <div className="mt-3">
          <h3 className="font-['Outfit'] text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
            {opportunity.title}
          </h3>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {opportunity.organization}
          </p>
        </div>

        {/* Match Score Gauge Banner */}
        <div className={`mt-3 flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold ${getBadgeStyle(score)}`}>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Match Fit: {score}% ({verdict})</span>
          </div>
          <span className="font-mono text-[11px]">{score >= 80 ? '🔥 High Fit' : '⚡ Good Fit'}</span>
        </div>

        {/* Description Snippet */}
        <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-2">
          {opportunity.description}
        </p>

        {/* Meta Info Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Deadline: <strong className={deadlineAnalysis.isExpired ? 'text-red-400' : 'text-slate-200'}>{deadlineAnalysis.formattedDate}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{opportunity.location}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate text-emerald-400 font-medium">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{opportunity.stipendOrPrize}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate font-mono text-[11px] text-slate-400">
            <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{opportunity.sourceDomain || 'User Ingested'}</span>
          </div>
        </div>

        {/* Matching Skills Tags */}
        {matchingSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Matched Skills:</span>
            {matchingSkills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                <Check className="h-2.5 w-2.5" /> {skill}
              </span>
            ))}
          </div>
        )}

      </div>

      {/* Action Footer Buttons */}
      <div className="mt-5 border-t border-slate-800/80 pt-3 flex items-center gap-2">
        
        {/* Copilot Pitch Writer Button */}
        <button
          id={`btn-copilot-${opportunity.id}`}
          onClick={() => setCopilotOpp(opportunity)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-300 hover:from-cyan-500/30 hover:to-indigo-500/30 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Copilot Pitch</span>
        </button>

        {/* Direct Apply Button */}
        {hasActionableApplyUrl ? (
          <a
            id={`link-apply-${opportunity.id}`}
            href={opportunity.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 text-xs font-semibold transition-colors"
          >
            <span>Apply</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span
            id={`link-apply-${opportunity.id}`}
            aria-disabled="true"
            className="flex cursor-not-allowed items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-500"
            title="No verified application link was supplied"
          >
            <span>Link unavailable</span>
          </span>
        )}

      </div>

    </div>
  );
};
