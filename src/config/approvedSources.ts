export type SourceType = 'official' | 'approved-platform' | 'community-submitted' | 'user-pasted';
export type TrustTier = 'tier-1-official' | 'tier-2-verified-platform' | 'tier-3-community';

export interface ApprovedSource {
  domain: string;
  name: string;
  sourceType: SourceType;
  trustTier: TrustTier;
  fetchSupported: boolean;
  description: string;
  allowedPaths?: string[];
}

export const APPROVED_SOURCES_REGISTRY: ApprovedSource[] = [
  {
    domain: 'devpost.com',
    name: 'Devpost',
    sourceType: 'approved-platform',
    trustTier: 'tier-2-verified-platform',
    fetchSupported: true,
    description: 'Global hackathon hosting platform'
  },
  {
    domain: 'mlh.io',
    name: 'Major League Hacking (MLH)',
    sourceType: 'official',
    trustTier: 'tier-1-official',
    fetchSupported: true,
    description: 'Official student hackathon league'
  },
  {
    domain: 'github.com',
    name: 'GitHub Education & Grants',
    sourceType: 'approved-platform',
    trustTier: 'tier-2-verified-platform',
    fetchSupported: true,
    description: 'Official developer community & student grant portal'
  },
  {
    domain: 'hec.gov.pk',
    name: 'Higher Education Commission Pakistan',
    sourceType: 'official',
    trustTier: 'tier-1-official',
    fetchSupported: true,
    description: 'Government higher education scholarships and tech grants'
  },
  {
    domain: 'fulbright.org',
    name: 'Fulbright Program',
    sourceType: 'official',
    trustTier: 'tier-1-official',
    fetchSupported: true,
    description: 'International educational exchange scholarship program'
  },
  {
    domain: 'usefp.org',
    name: 'USEFP Pakistan',
    sourceType: 'official',
    trustTier: 'tier-1-official',
    fetchSupported: true,
    description: 'United States Educational Foundation in Pakistan'
  },
  {
    domain: 'erasmus-plus.ec.europa.eu',
    name: 'Erasmus+ European Commission',
    sourceType: 'official',
    trustTier: 'tier-1-official',
    fetchSupported: true,
    description: 'European Union scholarship and mobility grant platform'
  },
  {
    domain: 'lablab.ai',
    name: 'Lablab.ai',
    sourceType: 'approved-platform',
    trustTier: 'tier-2-verified-platform',
    fetchSupported: true,
    description: 'AI & LLM specialized hackathons'
  },
  {
    domain: 'kaggle.com',
    name: 'Kaggle Competitions',
    sourceType: 'approved-platform',
    trustTier: 'tier-2-verified-platform',
    fetchSupported: true,
    description: 'Data science, ML & AI competitions portal'
  },
  {
    domain: 'unstop.com',
    name: 'Unstop',
    sourceType: 'approved-platform',
    trustTier: 'tier-2-verified-platform',
    fetchSupported: true,
    description: 'Student hackathons, hiring challenges, and grants platform'
  },
  {
    domain: 'hackerearth.com',
    name: 'HackerEarth',
    sourceType: 'approved-platform',
    trustTier: 'tier-2-verified-platform',
    fetchSupported: true,
    description: 'Global developer hackathons and coding challenges'
  },
  {
    domain: 'ycombinator.com',
    name: 'Y Combinator',
    sourceType: 'official',
    trustTier: 'tier-1-official',
    fetchSupported: true,
    description: 'Global startup accelerator grants & developer funds'
  }
];

/**
 * Normalizes a hostname/domain string for comparison (lowercase, strip www.)
 */
export function normalizeDomain(domainOrUrl: string): string {
  try {
    let host = domainOrUrl.trim().toLowerCase();
    if (host.includes('://')) {
      host = new URL(host).hostname;
    }
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host;
  } catch {
    return domainOrUrl.trim().toLowerCase().replace(/^www\./, '');
  }
}

/**
 * Checks if a hostname matches an approved source domain in the registry.
 */
export function findApprovedSource(urlOrDomain: string): ApprovedSource | null {
  const host = normalizeDomain(urlOrDomain);
  if (!host) return null;

  for (const source of APPROVED_SOURCES_REGISTRY) {
    const approvedDom = normalizeDomain(source.domain);
    if (host === approvedDom || host.endsWith(`.${approvedDom}`)) {
      return source;
    }
  }

  return null;
}

/**
 * Returns whether a domain is approved for safe automated fetching.
 */
export function isApprovedFetchDomain(urlOrDomain: string): boolean {
  const source = findApprovedSource(urlOrDomain);
  return source ? source.fetchSupported : false;
}
