import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Opportunity, MatchResult, FilterState } from '../types';
import { INITIAL_USER_PROFILE, INITIAL_OPPORTUNITIES } from '../services/mockData';
import { calculateLocalMatchScore } from '../services/fallbackService';
import { useAuth } from './AuthContext';

interface AppContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  opportunities: Opportunity[];
  addOpportunity: (opp: Opportunity) => void;
  savedIds: string[];
  toggleSaveOpportunity: (id: string) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_SAVED_KEY = 'opp_pulse_saved_ids_v2';
const LOCAL_OPPS_KEY = 'opp_pulse_custom_opps_v2';
const OLD_LOCAL_API_KEY = 'opp_pulse_gemini_api_key_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateUserAccount } = useAuth();

  // One-time migration to remove legacy client-side API key from localStorage
  useEffect(() => {
    if (localStorage.getItem(OLD_LOCAL_API_KEY)) {
      localStorage.removeItem(OLD_LOCAL_API_KEY);
    }
  }, []);

  // Profile derived from AuthContext or fallback
  const userProfile = currentUser || INITIAL_USER_PROFILE;

  const setUserProfile = (updatedProfile: UserProfile) => {
    updateUserAccount(updatedProfile);
  };

  // Load custom opportunities
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    const saved = localStorage.getItem(LOCAL_OPPS_KEY);
    if (saved) {
      try {
        const custom: Opportunity[] = JSON.parse(saved);
        return [...custom, ...INITIAL_OPPORTUNITIES];
      } catch (e) { console.error(e); }
    }
    return INITIAL_OPPORTUNITIES;
  });

  // Saved bookmark IDs
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_SAVED_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['opp_001', 'opp_005'];
  });

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

  // Add new opportunity from Ingestion Agent
  const addOpportunity = (opp: Opportunity) => {
    setOpportunities(prev => [opp, ...prev]);
    const existingCustom = JSON.parse(localStorage.getItem(LOCAL_OPPS_KEY) || '[]');
    localStorage.setItem(LOCAL_OPPS_KEY, JSON.stringify([opp, ...existingCustom]));
  };

  // Bookmark toggle
  const toggleSaveOpportunity = (id: string) => {
    setSavedIds(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Re-evaluate matches for all opportunities
  const reevaluateMatches = useCallback(async () => {
    setIsLoadingMatches(true);
    const newResults: Record<string, MatchResult> = {};

    for (const opp of opportunities) {
      newResults[opp.id] = calculateLocalMatchScore(userProfile, opp);
    }

    setMatchResults(newResults);
    setIsLoadingMatches(false);
  }, [userProfile, opportunities]);

  // Re-calculate matches when profile or opportunities change
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
        isLoadingMatches
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
