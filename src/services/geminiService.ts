import { Opportunity, UserProfile, MatchResult, ExtractedResumeProfile, AiGatewayRequest, AiGatewayResponse, EngineMode } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  calculateLocalMatchScore,
  generateLocalProposalDraft,
  parseLocalUnstructuredText,
  parseLocalResumeText
} from './fallbackService';

/**
 * Helper to execute calls against the secure server-side AI gateway (/api/ai).
 * Automatically attaches Supabase JWT token if available.
 */
async function callServerAiGateway<T>(payload: AiGatewayRequest): Promise<AiGatewayResponse<T> | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return null;
    }

    const json: AiGatewayResponse<T> = await response.json();
    if (json.success && json.data) {
      return json;
    }
  } catch (err) {
    console.warn('Server AI Gateway unavailable, switching to local heuristic fallback:', err);
  }

  return null;
}

/**
 * Evaluates an opportunity match score using Server AI Gateway if available,
 * falling back to local heuristic rules.
 */
export async function evaluateMatchWithGemini(
  profile: UserProfile,
  opp: Opportunity
): Promise<{ result: MatchResult; engineMode: EngineMode }> {
  const serverRes = await callServerAiGateway<MatchResult>({
    operation: 'evaluate-match',
    profile,
    opportunity: opp
  });

  if (serverRes?.success && serverRes.data) {
    return {
      result: {
        ...serverRes.data,
        engineMode: 'Secure Server AI Gateway'
      },
      engineMode: 'Secure Server AI Gateway'
    };
  }

  const localRes = calculateLocalMatchScore(profile, opp);
  return {
    result: {
      ...localRes,
      engineMode: 'Local Heuristic Engine'
    },
    engineMode: 'Local Heuristic Engine'
  };
}

/**
 * Generates a tailored application pitch using Server AI Gateway if available,
 * falling back to local heuristic draft generation.
 */
export async function generateCopilotPitchWithGemini(
  profile: UserProfile,
  opp: Opportunity
): Promise<{ pitch: string; engineMode: EngineMode }> {
  const serverRes = await callServerAiGateway<string>({
    operation: 'generate-pitch',
    profile,
    opportunity: opp
  });

  if (serverRes?.success && serverRes.data) {
    return {
      pitch: serverRes.data,
      engineMode: 'Secure Server AI Gateway'
    };
  }

  return {
    pitch: generateLocalProposalDraft(profile, opp),
    engineMode: 'Local Heuristic Engine'
  };
}

/**
 * Parses unstructured text or URL using Server AI Gateway if available,
 * falling back to local NLP extraction.
 */
export async function parseUnstructuredTextWithGemini(
  rawText: string
): Promise<{ opportunity: Opportunity; engineMode: EngineMode }> {
  const serverRes = await callServerAiGateway<Opportunity>({
    operation: 'ingest-text',
    rawText
  });

  if (serverRes?.success && serverRes.data) {
    return {
      opportunity: serverRes.data,
      engineMode: 'Secure Server AI Gateway'
    };
  }

  return {
    opportunity: parseLocalUnstructuredText(rawText),
    engineMode: 'Local Heuristic Engine'
  };
}

/**
 * Ingests an opportunity via the dedicated server-side ingestion API (/api/ingest).
 * Supports both URL fetching (approved domains only) and pasted raw text with fallback to local heuristic parsing.
 */
export async function ingestOpportunityWithProvenance(payload: {
  mode: 'url' | 'text';
  url?: string;
  rawText?: string;
}): Promise<{
  opportunity: Opportunity;
  duplicate?: { isDuplicate: boolean; existingId?: string; message?: string };
  engineMode: EngineMode;
  error?: string;
}> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const json: unknown = await response.json();
    if (!json || typeof json !== 'object') {
      throw new Error('Ingestion service returned an invalid response.');
    }
    const result = json as {
      success?: boolean;
      data?: { opportunity?: Opportunity; duplicate?: { isDuplicate: boolean; existingId?: string; message?: string } };
      engineMode?: EngineMode;
      error?: string;
    };
    if (response.ok && result.success && result.data?.opportunity) {
      return {
        opportunity: result.data.opportunity,
        duplicate: result.data.duplicate,
        engineMode: result.engineMode || 'Secure Server AI Gateway'
      };
    }

    if (result.error && payload.mode === 'text') {
      return {
        opportunity: parseLocalUnstructuredText(payload.rawText || ''),
        engineMode: 'Local Heuristic Engine',
        error: result.error
      };
    }

    throw new Error(result.error || 'Ingestion request failed.');
  } catch (err) {
    if (payload.mode === 'url') {
      throw err instanceof Error ? err : new Error('Trusted URL ingestion is unavailable.');
    }
    console.warn('Server ingestion route unavailable, falling back to local heuristic parser:', err);
  }

  const localOpp = parseLocalUnstructuredText(payload.rawText || '');
  return {
    opportunity: localOpp,
    engineMode: 'Local Heuristic Engine'
  };
}

/**
 * Parses CV / Resume text using Server AI Gateway if available,
 * falling back to local regex and heuristic extraction.
 */
export async function parseResumeWithGemini(
  resumeText: string
): Promise<{ profile: ExtractedResumeProfile; engineMode: EngineMode }> {
  const serverRes = await callServerAiGateway<ExtractedResumeProfile>({
    operation: 'extract-resume',
    resumeText
  });

  if (serverRes?.success && serverRes.data) {
    return {
      profile: {
        ...serverRes.data,
        engineMode: 'Secure Server AI Gateway'
      },
      engineMode: 'Secure Server AI Gateway'
    };
  }

  const localProfile = parseLocalResumeText(resumeText);
  return {
    profile: {
      ...localProfile,
      engineMode: 'Local Heuristic Engine'
    },
    engineMode: 'Local Heuristic Engine'
  };
}
