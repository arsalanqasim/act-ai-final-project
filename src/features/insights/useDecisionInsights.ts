import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateDecisionInsights } from '../../utils/insightMetrics';
export function useDecisionInsights() { const { opportunities, matchResults, savedIds, userProfile, isLoadingMatches } = useApp(); const insights=useMemo(()=>calculateDecisionInsights(opportunities,matchResults,savedIds,userProfile),[opportunities,matchResults,savedIds,userProfile]); return { insights, isLoading:isLoadingMatches, savedIds }; }
