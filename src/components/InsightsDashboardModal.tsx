import React, { useEffect } from 'react';
import { useDecisionInsights } from '../features/insights/useDecisionInsights';
import { useApp } from '../context/AppContext';
import { 
  X, 
  BarChart3, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Bookmark, 
  ArrowUpRight, 
  Lightbulb, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { NextBestAction, PrioritizedOpportunity } from '../features/insights/types';

interface InsightsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InsightsDashboardModal: React.FC<InsightsDashboardModalProps> = ({ isOpen, onClose }) => {
  const { insights, isLoading, savedIds } = useDecisionInsights();
  const { 
    toggleSaveOpportunity, 
    setCopilotOpp, 
    setIsProfileOpen, 
    setIsIngesterOpen,
    opportunities 
  } = useApp();

  // Escape key accessibility listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleActionClick = (action: NextBestAction) => {
    if (action.opportunityId) {
      const opp = opportunities.find(o => o.id === action.opportunityId);
      if (opp) {
        if (action.type === 'high_match_save') {
          toggleSaveOpportunity(opp.id);
        } else if (action.type === 'urgent_apply') {
          setCopilotOpp(opp);
        }
      }
    } else if (action.type === 'profile_enhancement') {
      setIsProfileOpen(true);
    } else if (action.type === 'pipeline_ingest') {
      setIsIngesterOpen(true);
    } else if (action.type === 'review_saved') {
      onClose();
    }
  };

  const isSaved = (id: string) => savedIds.includes(id);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insights-modal-title"
      aria-describedby="insights-modal-description"
      onClick={onClose}
    >
      <div 
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 id="insights-modal-title" className="font-['Outfit'] text-xl font-bold text-slate-900 flex items-center gap-2">
                Career Decision Radar & Insights
                <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700 border border-cyan-200">
                  Phase 3D Engine
                </span>
              </h2>
              <p id="insights-modal-description" className="text-xs text-slate-500">
                Deterministic decision support built from real in-app opportunity data & match scores.
              </p>
            </div>
          </div>
          <button
            id="btn-close-insights-modal"
            onClick={onClose}
            aria-label="Close insights modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-cyan-50 p-3 text-xs text-cyan-700 border border-cyan-200">
              <Zap className="h-4 w-4 animate-spin text-cyan-600" />
              Re-evaluating opportunity match fit indexes & updating decision pipeline...
            </div>
          )}

          {/* Zero-Data / Empty Pipeline Notice */}
          {opportunities.length === 0 && (
            <div className="rounded-2xl p-6 text-center border border-amber-200 bg-amber-50">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
              <h3 className="text-lg font-bold text-slate-900">No Active Opportunities in Radar</h3>
              <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
                Your opportunity pipeline is currently empty. Ingest custom opportunity links or raw text posts to populate your decision insights.
              </p>
              <button
                onClick={() => { onClose(); setIsIngesterOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700 transition-all"
              >
                <Sparkles className="h-4 w-4" /> Ingest Opportunity Now
              </button>
            </div>
          )}

          {/* Top Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Pipeline Coverage</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-slate-900">
                  {insights.conversion.totalOpportunities}
                </span>
                <span className="text-xs text-slate-500">items</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Total listings in active radar</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">High Match Fit</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-emerald-600">
                  {insights.matchDistribution.highFit}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  ({insights.matchDistribution.avgScore}% avg)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Listings with &ge;80% fit index</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Saved Conversion</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-purple-600">
                  {insights.conversion.conversionRate}%
                </span>
                <span className="text-xs text-purple-600 font-medium">
                  ({insights.conversion.savedCount} saved)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Ratio of bookmarked listings</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Urgent Closing</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-amber-600">
                  {insights.urgency.closingSoon}
                </span>
                <span className="text-xs text-amber-600 font-medium">
                  ({insights.urgency.savedClosingSoon} saved)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Closing within 7 days</p>
            </div>
          </div>

          {/* Section 1: Next Best Actions (Decision Support Engine) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-700 font-semibold text-sm">
                <Lightbulb className="h-4 w-4" />
                <span>Next Best Actions (AI Decision Engine)</span>
              </div>
              <span className="text-xs text-slate-500">Ranked by urgency & profile fit</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {insights.nextBestActions.map(action => (
                <div 
                  key={action.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-cyan-300 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">{action.title}</h4>
                      <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                        {action.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{action.description}</p>
                    
                    {/* Explicit Rationale "Why this action" */}
                    <div className="mt-3 rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-cyan-700">Why act now: </span>
                        <span>{action.why}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleActionClick(action)}
                    className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 py-2 text-xs font-semibold transition-all"
                  >
                    <span>{action.actionLabel}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Pipeline Category Distribution (Custom CSS Bar Chart) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-600" />
                Pipeline Volume by Opportunity Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of opportunities across active focus areas.
              </p>
            </div>

            {/* Screen reader text summary for accessibility */}
            <div className="sr-only">
              <h4>Opportunity Category Pipeline Breakdown Table:</h4>
              <ul>
                {insights.pipeline.map(item => (
                  <li key={item.category}>
                    {item.category}: {item.count} items ({item.percentage}%), {item.savedCount} saved.
                  </li>
                ))}
              </ul>
            </div>

            {/* Accessible Compact CSS Bar Chart */}
            <div className="space-y-3" aria-hidden="true">
              {insights.pipeline.map(item => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-900">{item.category}</span>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{item.savedCount} saved</span>
                      <span className="font-semibold text-slate-700">{item.count} ({item.percentage}%)</span>
                    </div>
                  </div>

                  <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Urgency Matrix & Trust Provenance (Two Columns) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            
            {/* Urgency Matrix */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Deadline Urgency Matrix
              </h3>
              <p className="text-xs text-slate-500">Time-sensitivity distribution of listings.</p>

              {/* Urgency Breakdown Rows */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-slate-700">Closing Soon (&le;7 days)</span>
                  </div>
                  <span className="font-bold text-amber-600">{insights.urgency.closingSoon}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700">Upcoming / Flexible (&gt;7 days)</span>
                  </div>
                  <span className="font-bold text-emerald-600">{insights.urgency.upcoming}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-600" />
                    <span className="text-slate-600">Past / Expired</span>
                  </div>
                  <span className="font-bold text-slate-500">{insights.urgency.overdue}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                💡 <span className="font-medium text-slate-900">Urgency Advice:</span> Focus application efforts on the <strong className="text-amber-700">{insights.urgency.closingSoon} items</strong> closing this week before their deadlines elapse.
              </div>
            </div>

            {/* Trust & Provenance Distribution */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Trust & Verification Provenance
              </h3>
              <p className="text-xs text-slate-500">Verification confidence across sources.</p>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                  <span className="text-emerald-700 font-medium">Official Domains (Tier 1)</span>
                  <span className="font-bold text-slate-900">{insights.trustDistribution.official}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                  <span className="text-cyan-700 font-medium">Approved Platforms (Tier 2)</span>
                  <span className="font-bold text-slate-900">{insights.trustDistribution.approved}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                  <span className="text-indigo-700 font-medium">Community Submitted (Tier 3)</span>
                  <span className="font-bold text-slate-900">{insights.trustDistribution.community}</span>
                </div>

                {insights.trustDistribution.needsReview > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                    <span className="text-amber-700 font-medium">Needs Verification Review</span>
                    <span className="font-bold text-amber-700">{insights.trustDistribution.needsReview}</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                🛡️ <span className="font-medium text-slate-900">Trust Guarantee:</span> High-priority queue favors official registry domains and verified URL sources.
              </div>
            </div>

          </div>

          {/* Section 4: High-Priority Action Queue */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-600" />
                  High-Priority Action Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Deterministic priority ranking combining match score, deadline urgency, trust score, & saved intent.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {insights.highPriorityQueue.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No active high-priority opportunities right now.</p>
              ) : (
                insights.highPriorityQueue.map((item: PrioritizedOpportunity, index: number) => {
                  const opp = item.opportunity;
                  const saved = isSaved(opp.id);

                  return (
                    <div 
                      key={opp.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-cyan-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-50 border border-cyan-200 text-[10px] font-bold text-cyan-700">
                            #{index + 1}
                          </span>
                          <h4 className="font-semibold text-sm text-slate-900">{opp.title}</h4>
                          <span className="text-xs text-slate-600">({opp.organization})</span>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200">
                            {item.matchScore}% Match Fit
                          </span>
                          <span className="rounded-md bg-cyan-50 px-2 py-0.5 font-semibold text-cyan-700 border border-cyan-200">
                            Priority Score: {item.priorityScore}/100
                          </span>
                          <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-700">
                            {opp.category}
                          </span>
                          {item.daysRemaining !== null && item.daysRemaining <= 7 && (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-700 font-medium border border-amber-200">
                              Closing in {item.daysRemaining}d
                            </span>
                          )}
                        </div>

                        {/* Priority Rationale Bullet list */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 pt-1">
                          {item.reasons.map((r, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-cyan-600 shrink-0" />
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleSaveOpportunity(opp.id)}
                          aria-label={saved ? `Remove bookmark for ${opp.title}` : `Bookmark ${opp.title}`}
                          className={`rounded-lg p-2 transition-colors ${
                            saved 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                        >
                          <Bookmark className={`h-4 w-4 ${saved ? 'fill-purple-600 text-purple-600' : ''}`} />
                        </button>
                        <button
                          onClick={() => setCopilotOpp(opp)}
                          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-3 py-1.5 text-xs transition-all"
                        >
                          <FileText className="h-3.5 w-3.5" /> Pitch Copilot
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 sm:px-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>OpportunityPulse Decision Support System • Zero key fallback active</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-1.5 text-slate-700 hover:bg-slate-300 font-medium transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

