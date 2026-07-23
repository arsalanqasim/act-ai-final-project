import { Opportunity, UserProfile, MatchResult } from '../types';

/**
 * Calculates a local heuristic match score (0-100) between a user profile and an opportunity.
 * Ensures 100% functionality without requiring an API key.
 */
export function calculateLocalMatchScore(profile: UserProfile, opp: Opportunity): MatchResult {
  let score = 30; // base score
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  const reasons: string[] = [];

  // 1. Skill Overlap Calculation (up to 40 points)
  const profileSkillsLower = profile.skills.map(s => s.toLowerCase());
  opp.techStackOrEligibility.forEach(req => {
    const reqLower = req.toLowerCase();
    const isMatched = profileSkillsLower.some(ps => reqLower.includes(ps) || ps.includes(reqLower));
    if (isMatched) {
      matchingSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  });

  if (opp.techStackOrEligibility.length > 0) {
    const skillRatio = matchingSkills.length / opp.techStackOrEligibility.length;
    const skillPoints = Math.round(skillRatio * 40);
    score += skillPoints;
    if (matchingSkills.length > 0) {
      reasons.push(`Matches ${matchingSkills.length} of your key skills: ${matchingSkills.slice(0, 3).join(', ')}.`);
    }
  } else {
    score += 25; // default skill points if open eligibility
  }

  // 2. Category Match (up to 15 points)
  if (profile.targetCategories.includes(opp.category)) {
    score += 15;
    reasons.push(`Directly fits your target category: ${opp.category}.`);
  }

  // 3. Location Match (up to 15 points)
  if (profile.preferredLocation === 'Remote' && opp.location.toLowerCase().includes('remote')) {
    score += 15;
    reasons.push(`Perfect remote work/competition format.`);
  } else if (profile.preferredLocation === opp.location) {
    score += 15;
    reasons.push(`Located in your preferred region (${opp.location}).`);
  } else if (opp.location.toLowerCase().includes('global')) {
    score += 10;
    reasons.push(`Global opportunity accessible worldwide.`);
  }

  // Cap score at 98 for realistic metrics
  score = Math.min(Math.max(score, 20), 98);

  // Verdict calculation
  let verdict: MatchResult['verdict'] = 'Low Compatibility';
  if (score >= 80) verdict = 'Excellent Match';
  else if (score >= 65) verdict = 'Good Match';
  else if (score >= 45) verdict = 'Moderate Match';

  if (reasons.length === 0) {
    reasons.push('General alignment with your academic background.');
  }

  return {
    opportunityId: opp.id,
    score,
    verdict,
    matchingSkills,
    missingSkills,
    reasons
  };
}

/**
 * Generates an algorithmic application pitch when no Gemini API key is configured.
 */
export function generateLocalProposalDraft(profile: UserProfile, opp: Opportunity): string {
  const matchRes = calculateLocalMatchScore(profile, opp);
  const matchedList = matchRes.matchingSkills.length > 0 
    ? matchRes.matchingSkills.join(', ') 
    : profile.skills.slice(0, 4).join(', ');

  return `### Application Pitch: ${opp.title}
**Applicant**: ${profile.name} (${profile.major}, ${profile.academicLevel})  
**Target Organization**: ${opp.organization}  
**Date**: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

---

#### 🎯 Executive Motivation & Fit
I am writing to express my strong enthusiasm for the **${opp.title}** hosted by **${opp.organization}**. As a ${profile.academicLevel} specializing in **${profile.major}**, my background aligns closely with your requirements.

#### ⚡ Technical Strengths & Skill Alignment
My core technical skillset directly matches key criteria specified for this ${opp.category.toLowerCase()}:
* **Core Technical Stack**: ${matchedList}
* **Project Experience**: Developed agentic web applications and interactive software products utilizing modern APIs and scalable frontend frameworks.
* **Problem Solving**: Experienced in rapid prototyping, team collaboration, and shipping production-ready applications.

#### 💡 Proposed Contribution / Plan
For this ${opp.category.toLowerCase()}, I intend to build a high-impact solution solving real-world challenges, utilizing my expertise in **${profile.skills[0] || 'Web Development'}** and **${profile.skills[1] || 'AI Integration'}**.

#### 📞 Contact & Portfolio
* **Email**: ${profile.email}
* **GitHub**: github.com/arsalanqasim

*Thank you for reviewing my application!*`;
}

/**
 * Fallback link/unstructured text parser.
 */
export function parseLocalUnstructuredText(rawText: string): Opportunity {
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  const title = lines[0] ? lines[0].slice(0, 60) : 'Ingested Tech Opportunity';

  return {
    id: `opp_ingest_${Date.now()}`,
    title: title.startsWith('http') ? 'Extracted Tech Opportunity' : title,
    organization: 'Web / Ingested Source',
    category: rawText.toLowerCase().includes('hackathon') ? 'Hackathon' :
              rawText.toLowerCase().includes('scholarship') ? 'Scholarship' :
              rawText.toLowerCase().includes('intern') ? 'Internship' : 'Grant',
    deadline: '2026-09-01',
    location: rawText.toLowerCase().includes('remote') ? 'Remote' : 'Global',
    stipendOrPrize: 'See Listing Details',
    techStackOrEligibility: ['Python', 'React', 'AI', 'JavaScript'],
    description: rawText.slice(0, 180) + '...',
    applyUrl: rawText.match(/https?:\/\/[^\s]+/)?.[0] || 'https://google.com',
    featured: true,
    postedDate: new Date().toISOString().split('T')[0]
  };
}
