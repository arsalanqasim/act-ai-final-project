import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Opportunity, MatchResult, FilterState, EngineMode, SavedOpportunityRow, CustomOpportunityRow } from '../types';
import { INITIAL_USER_PROFILE, INITIAL_OPPORTUNITIES } from '../services/mockData';
import { evaluateMatchWithGemini } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  opportunities: Opportunity[];
  addOpportunity: (opp: Opportunity) => Promise<void>;
  savedIds: string[];
  toggleSaveOpportunity: (id: string) => Promise<void>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  matchResults: Record<string, MatchResult>;
  reevaluateMatches: () => Promise<void>;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isIngesterOpen: boolean;
  setIsIngesterOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  copilotOpp: Opportunity | null;
  setCopilotOpp: (opp: Opportunity | null) => void;
  isLoadingMatches: boolean;
  engineMode: EngineMode;
  setEngineMode: (mode: EngineMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_SAVED_KEY = 'opp_pulse_saved_ids_v2';
const LOCAL_OPPS_KEY = 'opp_pulse_custom_opps_v2';
const OLD_LOCAL_API_KEY = 'opp_pulse_gemini_api_key_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, supabaseUser, isAuthenticated, isGuest, updateUserAccount } = useAuth();

  // One-time cleanup of legacy local API key
  useEffect(() => {
    if (localStorage.getItem(OLD_LOCAL_API_KEY)) {
      localStorage.removeItem(OLD_LOCAL_API_KEY);
    }
  }, []);

  // Derived user profile
  const userProfile = currentUser || INITIAL_USER_PROFILE;

  const setUserProfile = (updatedProfile: UserProfile) => {
    updateUserAccount(updatedProfile);
  };

  // State: Custom opportunities & Bookmarks
  const [customOpportunities, setCustomOpportunities] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [engineMode, setEngineMode] = useState<EngineMode>('Local Heuristic Engine');

  // Combined opportunities (Static seed + Custom ingested)
  const opportunities = React.useMemo(() => {
    return [...customOpportunities, ...INITIAL_OPPORTUNITIES];
  }, [customOpportunities]);

  // Load user app data (Bookmarks & Custom Opportunities) from Supabase or localStorage
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isAuthenticated && supabaseUser && isSupabaseConfigured) {
        // Load Bookmarks from Supabase
        try {
          const { data: savedData, error: savedErr } = await supabase
            .from('saved_opportunities')
            .select('opportunity_id')
            .eq('user_id', supabaseUser.id);

          if (!savedErr && savedData && isMounted) {
            const ids = (savedData as SavedOpportunityRow[]).map(s => s.opportunity_id);
            setSavedIds(ids);
          }
        } catch (e) {
          console.error('Error fetching saved opportunities from Supabase:', e);
        }

        // Load Custom Opportunities from Supabase
        try {
          const { data: oppData, error: oppErr } = await supabase
            .from('custom_opportunities')
            .select('*')
            .eq('user_id', supabaseUser.id)
            .order('created_at', { ascending: false });

          if (!oppErr && oppData && isMounted) {
            const opps: Opportunity[] = (oppData as CustomOpportunityRow[]).map(row => ({
              id: row.id,
              title: row.title,
              organization: row.organization,
              category: row.category,
              deadline: row.deadline,
              location: row.location,
              stipendOrPrize: row.stipend_or_prize,
              techStackOrEligibility: row.tech_stack_or_eligibility,
              description: row.description,
              applyUrl: row.apply_url,
              featured: row.featured,
              postedDate: row.posted_date,
              sourceUrl: row.source_url || undefined
            }));
            setCustomOpportunities(opps);
          }
        } catch (e) {
          console.error('Error fetching custom opportunities from Supabase:', e);
        }
      } else {
        // Guest mode fallback: load from localStorage
        const savedLoc = localStorage.getItem(LOCAL_SAVED_KEY);
        if (savedLoc) {
          try { setSavedIds(JSON.parse(savedLoc)); } catch (e) { console.error(e); }
        } else {
          setSavedIds(['opp_001', 'opp_005']);
        }

        const oppsLoc = localStorage.getItem(LOCAL_OPPS_KEY);
        if (oppsLoc) {
          try { setCustomOpportunities(JSON.parse(oppsLoc)); } catch (e) { console.error(e); }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, supabaseUser, isGuest]);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'All',
    minScore: 0,
    location: 'All',
    sortBy: 'match'
  });

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isIngesterOpen, setIsIngesterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copilotOpp, setCopilotOpp] = useState<Opportunity | null>(null);

  // Match Results State
  const [matchResults, setMatchResults] = useState<Record<string, MatchResult>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Add new custom opportunity
  const addOpportunity = async (opp: Opportunity) => {
    setCustomOpportunities(prev => [opp, ...prev]);

    if (isAuthenticated && supabaseUser && isSupabaseConfigured) {
      try {
        const payload: CustomOpportunityRow = {
          id: opp.id,
          user_id: supabaseUser.id,
          title: opp.title,
          organization: opp.organization,
          category: opp.category,
          deadline: opp.deadline,
          location: opp.location,
          stipend_or_prize: opp.stipendOrPrize,
          tech_stack_or_eligibility: opp.techStackOrEligibility,
          description: opp.description,
          apply_url: opp.applyUrl,
          featured: opp.featured ?? false,
          posted_date: opp.postedDate,
          source_url: opp.sourceUrl || null,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('custom_opportunities')
          .insert(payload);

        if (error) {
          console.error('Error inserting custom opportunity to Supabase:', error);
        }
      } catch (e) {
        console.error('Failed to insert custom opportunity to Supabase:', e);
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_OPPS_KEY) || '[]');
      localStorage.setItem(LOCAL_OPPS_KEY, JSON.stringify([opp, ...existing]));
    }
  };

  // Toggle Save Opportunity (Optimistic UI update with rollback)
  const toggleSaveOpportunity = async (id: string) => {
    const isCurrentlySaved = savedIds.includes(id);
    const updatedIds = isCurrentlySaved
      ? savedIds.filter(item => item !== id)
      : [...savedIds, id];

    // Optimistic state update
    setSavedIds(updatedIds);

    if (isAuthenticated && supabaseUser && isSupabaseConfigured) {
      try {
        if (isCurrentlySaved) {
          const { error } = await supabase
            .from('saved_opportunities')
            .delete()
            .eq('user_id', supabaseUser.id)
            .eq('opportunity_id', id);

          if (error) {
            console.error('Error deleting saved opportunity:', error);
            setSavedIds(savedIds); // Revert optimistic state
          }
        } else {
          const { error } = await supabase
            .from('saved_opportunities')
            .insert({
              user_id: supabaseUser.id,
              opportunity_id: id
            });

          if (error) {
            console.error('Error saving opportunity:', error);
            setSavedIds(savedIds); // Revert optimistic state
          }
        }
      } catch (e) {
        console.error('Failed to update bookmark on Supabase:', e);
        setSavedIds(savedIds); // Revert
      }
    } else {
      localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(updatedIds));
    }
  };

  // Re-evaluate matches for all opportunities
  const reevaluateMatches = useCallback(async () => {
    setIsLoadingMatches(true);
    const newResults: Record<string, MatchResult> = {};
    let activeEngineMode: EngineMode = 'Local Heuristic Engine';

    for (const opp of opportunities) {
      const { result, engineMode: mode } = await evaluateMatchWithGemini(userProfile, opp);
      newResults[opp.id] = result;
      if (mode === 'Secure Server AI Gateway') {
        activeEngineMode = 'Secure Server AI Gateway';
      }
    }

    setMatchResults(newResults);
    setEngineMode(activeEngineMode);
    setIsLoadingMatches(false);
  }, [userProfile, opportunities]);

  // Initial and reactive re-evaluation
  useEffect(() => {
    reevaluateMatches();
  }, [reevaluateMatches]);

  return (
    <AppContext.Provider
      value={{
        userProfile,
        setUserProfile,
        opportunities,
        addOpportunity,
        savedIds,
        toggleSaveOpportunity,
        filters,
        setFilters,
        matchResults,
        reevaluateMatches,
        isProfileOpen,
        setIsProfileOpen,
        isIngesterOpen,
        setIsIngesterOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        copilotOpp,
        setCopilotOpp,
        isLoadingMatches,
        engineMode,
        setEngineMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
