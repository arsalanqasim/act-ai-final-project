/**
 * Normalizes an opportunity URL for duplicate matching by lowercasing,
 * stripping fragment IDs, trailing slashes, and common tracking query parameters.
 */
export function normalizeOpportunityUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);

    // Lowercase protocol and host
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();

    // Strip hash fragment
    url.hash = '';

    // Strip tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'source', 'fbclid', 'gclid', 'mc_eid', 'trk'
    ];
    trackingParams.forEach(param => url.searchParams.delete(param));

    let result = url.toString();

    // Strip trailing slash if path is not just '/'
    if (result.endsWith('/') && url.pathname !== '/') {
      result = result.slice(0, -1);
    }

    return result;
  } catch {
    // If invalid URL structure, fallback to simple trimmed lowercase string
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Computes a simple, deterministic FNV-1a non-cryptographic string hash.
 * Works seamlessly in both browser and Node.js environments without async overhead.
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Generates a stable content hash for an opportunity based on its normalized key fields:
 * title, organization, and applyUrl / description text.
 */
export function generateOpportunityContentHash(
  title: string,
  organization: string,
  applyUrlOrText?: string
): string {
  const normTitle = (title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normOrg = (organization || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normApply = normalizeOpportunityUrl(applyUrlOrText) || (applyUrlOrText || '').trim().toLowerCase().slice(0, 100);

  const rawKey = `${normTitle}|${normOrg}|${normApply}`;
  const hashVal = fnv1aHash(rawKey);

  return `hash_${hashVal}`;
}
