import { GoogleGenerativeAI } from '@google/generative-ai';
import { Opportunity, UserProfile, MatchResult } from '../types';
import { calculateLocalMatchScore, generateLocalProposalDraft, parseLocalUnstructuredText } from './fallbackService';

/**
 * Gets a GoogleGenerativeAI client instance if key is available.
 */
function getGeminiClient(apiKey?: string): GoogleGenerativeAI | null {
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key.trim() === '') return null;
  return new GoogleGenerativeAI(key);
}

/**
 * Evaluates an opportunity match score using Gemini AI (or falls back to local heuristic).
 */
export async function evaluateMatchWithGemini(
  profile: UserProfile,
  opp: Opportunity,
  apiKey?: string
): Promise<MatchResult> {
  const ai = getGeminiClient(apiKey);
  if (!ai) {
    return calculateLocalMatchScore(profile, opp);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a Senior Career & Academic Placement Specialist.
Evaluate candidate suitability for an opportunity.

Candidate Profile:
- Name: ${profile.name}
- Major: ${profile.major} (${profile.academicLevel})
- Skills: ${profile.skills.join(', ')}
- Target Categories: ${profile.targetCategories.join(', ')}
- Preferred Location: ${profile.preferredLocation}

Opportunity Listing:
- Title: ${opp.title} (${opp.organization})
- Category: ${opp.category}
- Required Skills/Eligibility: ${opp.techStackOrEligibility.join(', ')}
- Location: ${opp.location}
- Description: ${opp.description}

Calculate a match score (0-100), list matching skills, missing skills, and a 2-sentence rationale.
Respond ONLY with valid JSON in this exact schema:
{
  "score": number,
  "verdict": "Excellent Match" | "Good Match" | "Moderate Match" | "Low Compatibility",
  "matchingSkills": string[],
  "missingSkills": string[],
  "reasons": string[]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        opportunityId: opp.id,
        score: Math.min(Math.max(parsed.score || 50, 0), 100),
        verdict: parsed.verdict || 'Good Match',
        matchingSkills: parsed.matchingSkills || [],
        missingSkills: parsed.missingSkills || [],
        reasons: parsed.reasons || ['Evaluated via Gemini AI model.']
      };
    }
  } catch (error) {
    console.warn('Gemini API call failed, falling back to local heuristic engine:', error);
  }

  return calculateLocalMatchScore(profile, opp);
}

/**
 * Generates a tailored application pitch using Gemini AI (or falls back to local proposal).
 */
export async function generateCopilotPitchWithGemini(
  profile: UserProfile,
  opp: Opportunity,
  apiKey?: string
): Promise<string> {
  const ai = getGeminiClient(apiKey);
  if (!ai) {
    return generateLocalProposalDraft(profile, opp);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an Executive Career Coach & Proposal Specialist.
Write a compelling, tailored 1-page application pitch in clean Markdown format.

Applicant Details:
- Name: ${profile.name}
- Major: ${profile.major} (${profile.academicLevel})
- Skills: ${profile.skills.join(', ')}
- Bio: ${profile.bio}

Target Opportunity:
- Title: ${opp.title} by ${opp.organization}
- Category: ${opp.category}
- Required Tech/Eligibility: ${opp.techStackOrEligibility.join(', ')}
- Description: ${opp.description}

Write a professional pitch including:
1. Executive Hook & Alignment
2. Technical Skill Match & Proven Experience
3. Value Proposition for ${opp.organization}
4. Professional Call to Action`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.warn('Gemini Copilot generation failed, falling back to local engine:', error);
    return generateLocalProposalDraft(profile, opp);
  }
}

/**
 * Parses unstructured text or URL into a structured Opportunity using Gemini AI.
 */
export async function parseUnstructuredTextWithGemini(
  rawText: string,
  apiKey?: string
): Promise<Opportunity> {
  const ai = getGeminiClient(apiKey);
  if (!ai) {
    return parseLocalUnstructuredText(rawText);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Extract structured opportunity data from the following raw text or post.
Raw Input:
"${rawText}"

Extract and return ONLY a valid JSON object matching this schema:
{
  "title": string,
  "organization": string,
  "category": "Hackathon" | "Scholarship" | "Internship" | "Grant" | "Tech Event",
  "deadline": string (YYYY-MM-DD format if present, else "2026-09-01"),
  "location": string,
  "stipendOrPrize": string,
  "techStackOrEligibility": string[],
  "description": string (2 sentences max),
  "applyUrl": string
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: `opp_ai_${Date.now()}`,
        title: parsed.title || 'Extracted Opportunity',
        organization: parsed.organization || 'Ingested Source',
        category: parsed.category || 'Hackathon',
        deadline: parsed.deadline || '2026-09-01',
        location: parsed.location || 'Remote',
        stipendOrPrize: parsed.stipendOrPrize || 'See details',
        techStackOrEligibility: parsed.techStackOrEligibility || ['AI', 'React'],
        description: parsed.description || rawText.slice(0, 150),
        applyUrl: parsed.applyUrl || 'https://google.com',
        featured: true,
        postedDate: new Date().toISOString().split('T')[0]
      };
    }
  } catch (error) {
    console.warn('Gemini text parsing failed, using local parser:', error);
  }

  return parseLocalUnstructuredText(rawText);
}
