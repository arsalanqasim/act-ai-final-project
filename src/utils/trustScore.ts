import { findApprovedSource, SourceType, TrustTier } from '../config/approvedSources';
import { getDeadlineStatus } from './dateUtils';

export type VerificationState = 'unverified' | 'source-confirmed' | 'needs-review' | 'expired';

export interface TrustScoreParams {
  sourceUrl?: string;
  applyUrl?: string;
  sourceType?: SourceType;
  isUrlFetched?: boolean;
  deadline?: string;
  title: string;
  organization: string;
  description: string;
  techStackOrEligibility: string[];
}

export interface TrustEvaluationResult {
  score: number; // 0 to 100
  trustTier: TrustTier;
  sourceType: SourceType;
  verificationState: VerificationState;
  label: string;
  domain: string | null;
  reasons: string[];
}

/**
 * Calculates a deterministic, explainable trust score and verification status for an opportunity.
 */
export function calculateTrustScore(params: TrustScoreParams): TrustEvaluationResult {
  let score = 20; // Base baseline score
  const reasons: string[] = [];

  const targetUrl = params.sourceUrl || params.applyUrl || '';
  const matchedSource = targetUrl ? findApprovedSource(targetUrl) : null;
  const domain = matchedSource ? matchedSource.domain : (targetUrl ? extractDomain(targetUrl) : null);

  // 1. Evaluate Approved Registry Domain (+35 max points)
  let computedSourceType: SourceType = params.sourceType || 'user-pasted';
  let computedTrustTier: TrustTier = 'tier-3-community';

  if (matchedSource) {
    computedSourceType = matchedSource.sourceType;
    computedTrustTier = matchedSource.trustTier;

    if (matchedSource.trustTier === 'tier-1-official') {
      score += 35;
      reasons.push(`Official Source Domain: Listed on verified registry (${matchedSource.name}).`);
    } else if (matchedSource.trustTier === 'tier-2-verified-platform') {
      score += 25;
      reasons.push(`Approved Platform Domain: Verified partner platform (${matchedSource.name}).`);
    }
  } else if (targetUrl && targetUrl.startsWith('https://')) {
    score += 10;
    reasons.push('Valid HTTPS URL from a community-submitted domain.');
  } else {
    reasons.push('User-pasted text source without direct approved domain verification.');
  }

  // 2. HTTPS & URL Validity (+15 points)
  if (params.applyUrl && params.applyUrl.startsWith('https://')) {
    score += 15;
    reasons.push('Secure HTTPS application URL provided.');
  } else if (!params.applyUrl) {
    score -= 10;
    reasons.push('Missing direct application link.');
  }

  // 3. Deadline & Freshness (+15 points)
  const deadlineAnalysis = getDeadlineStatus(params.deadline);
  if (deadlineAnalysis.status === 'Open') {
    score += 15;
    reasons.push(`Active opportunity (Deadline: ${deadlineAnalysis.formattedDate}).`);
  } else if (deadlineAnalysis.status === 'Closing soon') {
    score += 15;
    reasons.push(`Closing soon (${deadlineAnalysis.daysRemaining} days remaining).`);
  } else if (deadlineAnalysis.status === 'Expired') {
    reasons.push('Listing has passed its specified deadline.');
  } else {
    score += 5;
    reasons.push('Deadline format is flexible or unspecified.');
  }

  // 4. Metadata Completeness (+25 points)
  let metadataPoints = 0;
  if (params.title && params.title.trim().length >= 5) metadataPoints += 5;
  if (params.organization && params.organization.trim().length >= 2 && params.organization !== 'Web / Ingested Source') metadataPoints += 5;
  if (params.techStackOrEligibility && params.techStackOrEligibility.length > 0) metadataPoints += 5;
  if (params.description && params.description.trim().length >= 40) metadataPoints += 10;

  score += metadataPoints;
  if (metadataPoints >= 20) {
    reasons.push('High content completeness (Title, Organization, Eligibility, & Description).');
  }

  // Cap score if expired
  if (deadlineAnalysis.status === 'Expired') {
    score = Math.min(score, 40);
  }

  // Ensure score within 0 to 100
  score = Math.min(Math.max(score, 0), 100);

  // 5. Compute Verification State & User Label
  let verificationState: VerificationState = 'unverified';
  let label = 'Community Submitted';

  if (deadlineAnalysis.status === 'Expired') {
    verificationState = 'expired';
    label = 'Expired';
  } else if (params.isUrlFetched && matchedSource && score >= 75) {
    // Verified ONLY if server URL fetch was performed against an approved source domain!
    verificationState = 'source-confirmed';
    label = matchedSource.trustTier === 'tier-1-official' ? 'Official Source' : 'Approved Platform';
  } else if (score < 50) {
    verificationState = 'needs-review';
    label = 'Needs Review';
  } else {
    verificationState = 'unverified';
    label = 'Community Submitted';
  }

  return {
    score,
    trustTier: computedTrustTier,
    sourceType: computedSourceType,
    verificationState,
    label,
    domain,
    reasons
  };
}

function extractDomain(urlStr: string): string | null {
  try {
    const host = new URL(urlStr).hostname;
    return host.replace(/^www\./, '');
  } catch {
    return null;
  }
}
