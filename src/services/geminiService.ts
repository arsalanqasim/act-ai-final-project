import { Opportunity, UserProfile, MatchResult, ExtractedResumeProfile } from '../types';
import {
  calculateLocalMatchScore,
  generateLocalProposalDraft,
  parseLocalUnstructuredText,
  parseLocalResumeText
} from './fallbackService';

/**
 * Evaluates an opportunity match score using the local smart heuristic engine (Phase 0).
 */
export async function evaluateMatchWithGemini(
  profile: UserProfile,
  opp: Opportunity
): Promise<MatchResult> {
  return calculateLocalMatchScore(profile, opp);
}

/**
 * Generates a tailored application pitch using the local heuristic proposal generator (Phase 0).
 */
export async function generateCopilotPitchWithGemini(
  profile: UserProfile,
  opp: Opportunity
): Promise<string> {
  return generateLocalProposalDraft(profile, opp);
}

/**
 * Parses unstructured text or URL into a structured Opportunity using local NLP extraction (Phase 0).
 */
export async function parseUnstructuredTextWithGemini(
  rawText: string
): Promise<Opportunity> {
  return parseLocalUnstructuredText(rawText);
}

/**
 * Parses CV / Resume text using local regex and heuristic extraction (Phase 0).
 */
export async function parseResumeWithGemini(
  resumeText: string
): Promise<ExtractedResumeProfile> {
  return parseLocalResumeText(resumeText);
}
