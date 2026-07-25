import React from 'react';
import { useApp } from '../context/AppContext';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityCategory, FilterState } from '../types';
import { Search, Sparkles, Layers } from 'lucide-react';

export const OpportunityFeed: React.FC = () => {
  const { opportunities, filters, setFilters, matchResults, isLoadingMatches } = useApp();

  const categories: ('All' | OpportunityCategory)[] = [
    'All',
    'Hackathon',
    'Scholarship',
    'Internship',
    'Grant',
    'Tech Event'
  ];

  // Filter & Sort Logic
  const filteredOpportunities = opportunities.filter(opp => {
    // Search query match
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchOrg = opp.organization.toLowerCase().includes(q);
      const matchDesc = opp.description.toLowerCase().includes(q);
      const matchSkills = opp.techStackOrEligibility.some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchOrg && !matchDesc && !matchSkills) return false;
    }

    // Category match
    if (filters.category !== 'All' && opp.category !== filters.category) {
      return false;
    }

    // Location match
    if (filters.location !== 'All') {
      const loc = opp.location.toLowerCase();
      if (filters.location === 'Remote' && !loc.includes('remote')) return false;
      if (filters.location === 'Pakistan' && !loc.includes('pakistan')) return false;
      if (filters.location === 'Global' && !loc.includes('global')) return false;
    }

    // Min Score filter
    const score = matchResults[opp.id]?.score ?? 75;
    if (score < filters.minScore) return false;

    return true;
  });

  // Sort logic
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    if (filters.sortBy === 'match') {
      const scoreA = matchResults[a.id]?.score ?? 75;
      const scoreB = matchResults[b.id]?.score ?? 75;
      return scoreB - scoreA; // highest match first
    }
    if (filters.sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (filters.sortBy === 'recent') {
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    }
    return 0;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      
      {/* Category Tabs & Controls */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6">
        
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex w-full sm:w-auto items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`tab-category-${cat.toLowerCase()}`}
                onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  filters.category === cat
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sort:</span>
            <select
              id="select-sort-by"
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
              className="glass-input rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 border-slate-800"
            >
              <option value="match">🔥 Highest Match Fit</option>
              <option value="deadline">⏳ Earliest Deadline</option>
              <option value="recent">✨ Most Recent</option>
            </select>
          </div>

        </div>

        {/* Bottom Search & Secondary Filters Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="input-search-opportunities"
              type="text"
              placeholder="Search by keywords, organization, skills (e.g. React, Python, Fulbright)..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm"
            />
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium shrink-0">Location:</span>
            <select
              id="select-filter-location"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value as FilterState['location'] }))}
              className="glass-input rounded-xl px-3 py-2 text-xs font-medium text-slate-200 border-slate-800 flex-1 sm:flex-none"
            >
              <option value="All">All Locations</option>
              <option value="Remote">🌐 Remote Only</option>
              <option value="Pakistan">🇵🇰 Pakistan Only</option>
              <option value="Global">✈️ International / Global</option>
            </select>
          </div>

        </div>

      </div>

      {/* Grid Results Header */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-['Outfit'] text-xl font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-cyan-400" />
          <span>Matched Opportunities</span>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
            {sortedOpportunities.length}
          </span>
        </h2>

        {isLoadingMatches && (
          <span className="flex items-center gap-1.5 text-xs text-cyan-400 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" /> Evaluating opportunity matches...
          </span>
        )}
      </div>

      {/* Grid Cards Container */}
      {sortedOpportunities.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              matchResult={matchResults[opp.id]}
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center py-16 glass-panel rounded-3xl border border-slate-800">
          <Sparkles className="mx-auto h-10 w-10 text-slate-500" />
          <h3 className="mt-3 text-lg font-bold text-slate-200">No opportunities match your filters</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, selecting "All" categories, or clicking "Ingest Link" to add a new opportunity!
          </p>
          <button
            onClick={() => setFilters({ searchQuery: '', category: 'All', minScore: 0, location: 'All', sortBy: 'match' })}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
          >
            Reset All Filters
          </button>
        </div>
      )}

    </section>
  );
};
