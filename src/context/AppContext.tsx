import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Opportunity, MatchResult, FilterState } from '../types';
import { INITIAL_USER_PROFILE, INITIAL_OPPORTUNITIES } from '../services/mockData';
import { evaluateMatchWithGemini } from '../services/geminiService';
import { calculateLocalMatchScore } from '../services/fallbackService';

interface AppContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  opportunities: Opportunity[];
  addOpportunity: (opp: Opportunity) => void;
  savedIds: string[];
  toggleSaveOpportunity: (id: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
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

const LOCAL_PROFILE_KEY = 'opp_pulse_user_profile_v1';
const LOCAL_SAVED_KEY = 'opp_pulse_saved_ids_v1';
const LOCAL_API_KEY = 'opp_pulse_gemini_api_key_v1';
const LOCAL_OPPS_KEY = 'opp_pulse_custom_opps_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial profile from localStorage or fallback
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USER_PROFILE;
  });

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

  // API Key
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(LOCAL_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
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

  // Save profile to localStorage
  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  };

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

  // Save API key
  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(LOCAL_API_KEY, key);
  };

  // Re-evaluate matches for all opportunities
  const reevaluateMatches = async () => {
    setIsLoadingMatches(true);
    const newResults: Record<string, MatchResult> = {};

    for (const opp of opportunities) {
      if (apiKey && apiKey.trim() !== '') {
        const res = await evaluateMatchWithGemini(userProfile, opp, apiKey);
        newResults[opp.id] = res;
      } else {
        newResults[opp.id] = calculateLocalMatchScore(userProfile, opp);
      }
    }

    setMatchResults(newResults);
    setIsLoadingMatches(false);
  };

  // Re-calculate matches when profile, opportunities, or API key changes
  useEffect(() => {
    reevaluateMatches();
  }, [userProfile, opportunities.length, apiKey]);

  return (
    <AppContext.Provider
      value={{
        userProfile,
        setUserProfile,
        opportunities,
        addOpportunity,
        savedIds,
        toggleSaveOpportunity,
        apiKey,
        setApiKey: handleSetApiKey,
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
