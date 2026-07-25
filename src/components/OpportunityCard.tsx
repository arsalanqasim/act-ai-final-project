import React from 'react';
import { Opportunity, MatchResult } from '../types';
import { useApp } from '../context/AppContext';
import { useApplications } from '../context/ApplicationContext';
import { getDeadlineStatus } from '../utils/dateUtils';
import { Calendar, MapPin, DollarSign, Bookmark, Sparkles, ExternalLink, Check, ShieldCheck, Globe, AlertCircle } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  matchResult?: MatchResult;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, matchResult }) => {
  const { savedIds, toggleSaveOpportunity, setCopilotOpp } = useApp();
  const { openWorkspaceModal } = useApplications();
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
    if (s >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s >= 65) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (s >= 45) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  // Category Badge color
  const getCategoryColor = (cat: Opportunity['category']) => {
    switch (cat) {
      case 'Hackathon': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Scholarship': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Internship': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Grant': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div 
      id={`opp-card-${opportunity.id}`}
      className={`flex flex-col justify-between rounded-2xl p-5 relative overflow-hidden group bg-white border shadow-sm hover:shadow-md transition-shadow ${
        deadlineAnalysis.isExpired ? 'opacity-75 border-slate-200' : ''
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
              <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> {opportunity.trustLabel || 'Verified Source'}
              </span>
            ) : deadlineAnalysis.isExpired ? (
              <span className="rounded-lg bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-bold text-red-700 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Expired
              </span>
            ) : (
              <span className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 flex items-center gap-1">
                <Globe className="h-3 w-3 text-slate-500" /> {opportunity.trustLabel || 'Community'}
              </span>
            )}

            {/* Featured Badge */}
            {opportunity.featured && (
              <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700 flex items-center gap-1">
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
                ? 'border-purple-200 bg-purple-50 text-purple-700' 
                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={isSaved ? 'Remove from Bookmarks' : 'Save Opportunity'}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-purple-600' : ''}`} />
          </button>

        </div>

        {/* Opportunity Title & Organization */}
        <div className="mt-3">
          <h3 className="font-['Outfit'] text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-1">
            {opportunity.title}
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
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
        <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-2">
          {opportunity.description}
        </p>

        {/* Meta Info Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
            <span className="truncate">Deadline: <strong className={deadlineAnalysis.isExpired ? 'text-red-600' : 'text-slate-800'}>{deadlineAnalysis.formattedDate}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">{opportunity.location}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate text-emerald-700 font-medium">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{opportunity.stipendOrPrize}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate font-mono text-[11px] text-slate-500">
            <Globe className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
            <span className="truncate">{opportunity.sourceDomain || 'User Ingested'}</span>
          </div>
        </div>

        {/* Matching Skills Tags */}
        {matchingSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Matched Skills:</span>
            {matchingSkills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                <Check className="h-2.5 w-2.5" /> {skill}
              </span>
            ))}
          </div>
        )}

      </div>

      {/* Action Footer Buttons */}
      <div className="mt-5 border-t border-slate-100 pt-3 flex items-center gap-2">
        <button
          id={`btn-track-application-${opportunity.id}`}
          onClick={() => openWorkspaceModal(opportunity)}
          className="flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
          title="Track this application"
        >
          Track
        </button>
        
        {/* Copilot Pitch Writer Button */}
        <button
          id={`btn-copilot-${opportunity.id}`}
          onClick={() => setCopilotOpp(opportunity)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 border-none px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-all shadow-md shadow-cyan-500/20"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-100" />
          <span>Copilot Pitch</span>
        </button>

        {/* Direct Apply Button */}
        {hasActionableApplyUrl ? (
          <a
            id={`link-apply-${opportunity.id}`}
            href={opportunity.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Apply</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span
            id={`link-apply-${opportunity.id}`}
            aria-disabled="true"
            className="flex cursor-not-allowed items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400"
            title="No verified application link was supplied"
          >
            <span>Link unavailable</span>
          </span>
        )}

      </div>

    </div>
  );
};
