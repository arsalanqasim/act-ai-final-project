import { Opportunity, UserProfile, OpportunityCategory } from '../../types';
import { getDeadlineStatus, DeadlineAnalysis } from '../../utils/dateUtils';

export interface NotificationPreferences {
  userId?: string;
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  minimumMatchScore: number;
  categories: OpportunityCategory[];
  timezone: string;
  digestHour: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RankedOpportunityDigestItem {
  opportunity: Opportunity;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  deadlineAnalysis: DeadlineAnalysis;
  provenanceLabel: string;
}

/**
 * Calculates a 0-100 match score for an opportunity against user profile skills & target categories.
 */
export function calculateMatchScoreForOpportunity(
  opportunity: Opportunity,
  profile: Partial<UserProfile>
): { score: number; matchingSkills: string[]; missingSkills: string[] } {
  const userSkills = (profile.skills || []).map(s => s.toLowerCase().trim());
  const oppReqs = (opportunity.techStackOrEligibility || []).map(s => s.toLowerCase().trim());

  if (oppReqs.length === 0) {
    const catMatch = (profile.targetCategories || []).includes(opportunity.category);
    return {
      score: catMatch ? 80 : 65,
      matchingSkills: [],
      missingSkills: []
    };
  }

  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of oppReqs) {
    const isMatch = userSkills.some(skill => skill.includes(req) || req.includes(skill));
    if (isMatch) {
      matchingSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const skillRatio = matchingSkills.length / oppReqs.length;
  let baseScore = Math.round(skillRatio * 100);

  const categoryMatch = (profile.targetCategories || []).includes(opportunity.category);
  if (categoryMatch) {
    baseScore = Math.min(100, baseScore + 15);
  }

  if (opportunity.trustScore && opportunity.trustScore >= 80) {
    baseScore = Math.min(100, baseScore + 5);
  }

  return {
    score: Math.max(10, Math.min(100, baseScore)),
    matchingSkills,
    missingSkills
  };
}

/**
 * Filters and ranks opportunities for digest dispatch or preview.
 */
export function filterAndRankOpportunitiesForDigest(
  opportunities: Opportunity[],
  profile: Partial<UserProfile>,
  preferences: NotificationPreferences
): RankedOpportunityDigestItem[] {
  const minScore = preferences.minimumMatchScore ?? 70;
  const targetCategories = preferences.categories && preferences.categories.length > 0
    ? preferences.categories
    : null;

  const rankedItems: RankedOpportunityDigestItem[] = [];

  for (const opp of opportunities) {
    // 1. Exclude expired items
    const deadlineAnalysis = getDeadlineStatus(opp.deadline);
    if (deadlineAnalysis.isExpired || opp.verificationState === 'expired') {
      continue;
    }

    // 2. Exclude low trust items
    if (opp.trustScore !== undefined && opp.trustScore < 40) {
      continue;
    }

    // 3. Filter by category preference if specified
    if (targetCategories && !targetCategories.includes(opp.category as OpportunityCategory)) {
      continue;
    }

    // 4. Calculate semantic match score
    const { score, matchingSkills, missingSkills } = calculateMatchScoreForOpportunity(opp, profile);

    // 5. Enforce minimum score threshold
    if (score < minScore) {
      continue;
    }

    // 6. Provenance label
    const provenanceLabel = opp.trustLabel ||
      (opp.trustTier === 'tier-1-official' ? 'Official Source' :
       opp.trustTier === 'tier-2-verified-platform' ? 'Approved Platform' : 'Community Verified');

    rankedItems.push({
      opportunity: opp,
      matchScore: score,
      matchingSkills,
      missingSkills,
      deadlineAnalysis,
      provenanceLabel
    });
  }

  return rankedItems.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    const daysA = a.deadlineAnalysis.daysRemaining ?? 999;
    const daysB = b.deadlineAnalysis.daysRemaining ?? 999;
    return daysA - daysB;
  });
}

/**
 * Builds HTML email template for OpportunityPulse AI Digest.
 */
export function buildDigestHtml(
  user: { name?: string; email?: string },
  items: RankedOpportunityDigestItem[],
  preferences: NotificationPreferences
): string {
  const userName = user.name || 'Tech Innovator';
  const count = items.length;
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const cardsHtml = items.map(item => {
    const opp = item.opportunity;
    const scoreColor = item.matchScore >= 85 ? '#10B981' : item.matchScore >= 70 ? '#06B6D4' : '#6366F1';
    const deadlineText = item.deadlineAnalysis.status === 'Closing soon'
      ? `Closing Soon (${item.deadlineAnalysis.daysRemaining} days left)`
      : item.deadlineAnalysis.formattedDate;

    return `
      <div style="background-color: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <span style="display: inline-block; background-color: rgba(6, 182, 212, 0.15); color: #22D3EE; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; margin-bottom: 6px;">
              ${opp.category}
            </span>
            <h3 style="margin: 4px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 700; line-height: 1.3;">
              ${opp.title}
            </h3>
            <p style="margin: 2px 0 0 0; color: #94A3B8; font-size: 13px;">
              ${opp.organization} • <span style="color: #CBD5E1;">${item.provenanceLabel}</span>
            </p>
          </div>
          <div style="text-align: right; background-color: rgba(15, 23, 42, 0.6); padding: 6px 12px; border-radius: 8px; border: 1px solid #334155;">
            <div style="font-size: 16px; font-weight: 800; color: ${scoreColor};">
              ${item.matchScore}%
            </div>
            <div style="font-size: 10px; color: #64748B; text-transform: uppercase;">
              Match Score
            </div>
          </div>
        </div>

        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.5; margin: 12px 0;">
          ${opp.description ? opp.description.slice(0, 220) + (opp.description.length > 220 ? '...' : '') : ''}
        </p>

        <div style="margin-bottom: 14px; font-size: 12px; color: #94A3B8;">
          <strong style="color: #E2E8F0;">Stipend / Prize:</strong> ${opp.stipendOrPrize || 'See listing'} |
          <strong style="color: #E2E8F0;">Location:</strong> ${opp.location} |
          <strong style="color: #F59E0B;">Deadline:</strong> ${deadlineText}
        </div>

        ${item.matchingSkills.length > 0 ? `
          <div style="margin-bottom: 14px;">
            <span style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Matching Stack:</span>
            ${item.matchingSkills.slice(0, 5).map(skill => `
              <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #34D399; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-right: 4px; margin-bottom: 4px;">
                ✓ ${skill}
              </span>
            `).join('')}
          </div>
        ` : ''}

        <div style="margin-top: 16px; text-align: right;">
          <a href="${opp.applyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #06B6D4; color: #0F172A; font-weight: 700; font-size: 13px; padding: 8px 18px; border-radius: 8px; text-decoration: none;">
            View & Apply Direct →
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpportunityPulse AI Digest</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
          <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1E293B; margin-bottom: 24px;">
            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0;">
              Opportunity<span style="color: #22D3EE;">Pulse</span> AI Digest
            </h1>
            <p style="color: #64748B; font-size: 13px; margin: 6px 0 0 0;">
              High-Signal Career Radar • ${dateStr}
            </p>
          </div>

          <div style="background-color: #1E293B; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; border-left: 4px solid #06B6D4;">
            <p style="color: #E2E8F0; font-size: 14px; margin: 0; line-height: 1.5;">
              Hi <strong>${userName}</strong>, we found <strong>${count} high-match opportunity alert${count === 1 ? '' : 's'}</strong> matching your profile and min match score of ${preferences.minimumMatchScore}%.
            </p>
          </div>

          ${cardsHtml}

          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1E293B; text-align: center; color: #64748B; font-size: 12px; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">
              OpportunityPulse AI • Autonomous Radar for Hackathons, Grants, Scholarships & Internships
            </p>
            <p style="margin: 0;">
              Frequency: <strong>${preferences.frequency}</strong> | Min Score: <strong>${preferences.minimumMatchScore}%</strong>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Builds Plain Text email template variant for OpportunityPulse AI Digest.
 */
export function buildDigestText(
  user: { name?: string; email?: string },
  items: RankedOpportunityDigestItem[],
  preferences: NotificationPreferences
): string {
  const userName = user.name || 'Tech Innovator';
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  let text = `OPPORTUNITYPULSE AI DIGEST - ${dateStr}\n`;
  text += `==================================================\n\n`;
  text += `Hi ${userName},\n`;
  text += `We found ${items.length} high-signal opportunity match(es) for your profile (Min Match Score: ${preferences.minimumMatchScore}%).\n\n`;

  items.forEach((item, idx) => {
    const opp = item.opportunity;
    text += `[${idx + 1}] ${opp.title} (${item.matchScore}% MATCH)\n`;
    text += `Category: ${opp.category} | Organization: ${opp.organization}\n`;
    text += `Source: ${item.provenanceLabel}\n`;
    text += `Stipend / Prize: ${opp.stipendOrPrize || 'N/A'}\n`;
    text += `Deadline: ${item.deadlineAnalysis.formattedDate} (${item.deadlineAnalysis.status})\n`;
    if (item.matchingSkills.length > 0) {
      text += `Matching Tech: ${item.matchingSkills.join(', ')}\n`;
    }
    text += `Apply Direct: ${opp.applyUrl}\n`;
    text += `--------------------------------------------------\n\n`;
  });

  text += `Manage your notification preferences or frequency in OpportunityPulse AI settings.\n`;
  return text;
}

