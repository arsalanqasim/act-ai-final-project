import { findApprovedSource, ApprovedSource } from '../../src/config/approvedSources';
import { lookup } from 'node:dns/promises';

/**
 * Helper to test whether an IP address (IPv4 or IPv6) is loopback, private, or metadata address.
 */
export function isPrivateOrLoopbackIp(ipStr: string): boolean {
  const ip = ipStr.trim().toLowerCase();

  // IPv4 checks
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);
  if (match) {
    const octets = match.slice(1, 5).map(Number);
    if (octets.some(o => o < 0 || o > 255)) return true;

    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return true;
    // 10.0.0.0/8 (Private)
    if (octets[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (octets[0] === 192 && octets[1] === 168) return true;
    // 169.254.0.0/16 (Link-local & AWS Metadata 169.254.169.254)
    if (octets[0] === 169 && octets[1] === 254) return true;
    // 0.0.0.0/8
    if (octets[0] === 0) return true;

    return false;
  }

  // IPv6 checks
  if (ip === '::1' || ip === '::' || ip.startsWith('0:0:0:0:0:0:0:1')) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // Unique local fc00::/7
  if (ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb')) return true; // Link local fe80::/10
  if (ip.includes('::ffff:')) {
    const v4Part = ip.split('::ffff:')[1];
    if (v4Part && isPrivateOrLoopbackIp(v4Part)) return true;
  }

  return false;
}

/**
 * Helper to check whether a host is localhost or internal domain.
 */
export function isLocalOrInternalHost(hostStr: string): boolean {
  const host = hostStr.trim().toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan') || host.endsWith('.router')) return true;
  if (isPrivateOrLoopbackIp(host)) return true;
  return false;
}

export interface UrlSecurityValidationResult {
  isValid: boolean;
  error?: string;
  source?: ApprovedSource;
  parsedUrl?: URL;
}

/**
 * Validates a target URL against protocol, SSRF rules, credentials, allowed ports, and approved domain registry.
 */
export function validateUrlSecurityAndDomain(urlString: string): UrlSecurityValidationResult {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(urlString.trim());
  } catch {
    return { isValid: false, error: 'Invalid or malformed URL string.' };
  }

  // 1. Enforce HTTPS only
  if (parsedUrl.protocol !== 'https:') {
    return { isValid: false, error: 'Insecure protocol. Only HTTPS URLs are allowed.' };
  }

  // 2. Reject credentials in URL
  if (parsedUrl.username || parsedUrl.password) {
    return { isValid: false, error: 'URL containing embedded user credentials is not permitted.' };
  }

  // 3. Reject non-standard ports (Only standard 443 or default empty port allowed)
  if (parsedUrl.port && parsedUrl.port !== '443') {
    return { isValid: false, error: `Non-standard port '${parsedUrl.port}' is prohibited.` };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 4. Reject localhost, private IP ranges, and internal hostnames
  if (isLocalOrInternalHost(hostname)) {
    return { isValid: false, error: 'Access to localhost, private IPs, or internal network addresses is blocked.' };
  }

  // 5. Match against Approved Domain Registry
  const source = findApprovedSource(hostname);
  if (!source) {
    return {
      isValid: false,
      error: `Domain '${hostname}' is not in the approved opportunity sources registry.`
    };
  }

  if (!source.fetchSupported) {
    return {
      isValid: false,
      error: `URL fetching is currently disabled for domain '${source.name}'. Please paste listing text instead.`,
      source
    };
  }

  return {
    isValid: true,
    source,
    parsedUrl
  };
}

/**
 * Extracts readable body text from HTML markup by stripping scripts, styles, navs, footers, and HTML tags.
 */
export function extractReadableTextFromHtml(html: string): string {
  if (!html) return '';

  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Add linebreaks for structural HTML tags
  cleaned = cleaned
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Normalize whitespace & newlines
  const lines = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const fullText = lines.join('\n');
  return fullText.slice(0, 15000); // Cap at 15K characters for AI prompt safety
}

/**
 * Safely fetches raw HTML content from an approved target URL.
 * Enforces timeout, max payload size limit, max redirects, and re-validates redirect targets against SSRF rules.
 */
export function fetchHtmlSafely(targetUrl: string, maxRedirects = 3): Promise<string> {
  return new Promise((resolve, reject) => {
    const currentUrlStr = targetUrl;
    let redirectCount = 0;

    const executeFetch = async (urlToFetch: string) => {
      const validation = validateUrlSecurityAndDomain(urlToFetch);
      if (!validation.isValid) {
        reject(new Error(validation.error || 'Security check failed for URL.'));
        return;
      }

      try {
        const resolvedAddresses = await lookup(new URL(urlToFetch).hostname, { all: true, verbatim: true });
        if (resolvedAddresses.length === 0 || resolvedAddresses.some(address => isPrivateOrLoopbackIp(address.address))) {
          reject(new Error('Target hostname resolved to a blocked network address.'));
          return;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'DNS resolution failed.';
        reject(new Error(`Could not safely resolve target hostname: ${message}`));
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(urlToFetch, {
          method: 'GET',
          headers: {
            'User-Agent': 'OpportunityPulseAI-IngestionBot/1.0 (+https://opportunitypulse.ai)',
            'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9'
          },
          redirect: 'manual', // Intercept redirects to re-validate security
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check redirect status codes (301, 302, 303, 307, 308)
        if (response.status >= 300 && response.status < 400) {
          const locationHeader = response.headers.get('location');
          if (!locationHeader) {
            reject(new Error('Redirect response missing Location header.'));
            return;
          }

          if (redirectCount >= maxRedirects) {
            reject(new Error(`Maximum redirect limit (${maxRedirects}) exceeded.`));
            return;
          }

          redirectCount++;
          const resolvedRedirectUrl = new URL(locationHeader, urlToFetch).toString();
          executeFetch(resolvedRedirectUrl);
          return;
        }

        if (!response.ok) {
          reject(new Error(`HTTP error ${response.status} ${response.statusText} fetching source URL.`));
          return;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('xhtml')) {
          reject(new Error(`Unsupported Content-Type '${contentType}'. Only HTML/text pages are accepted.`));
          return;
        }

        // Read response body with size limit (max 500 KB)
        const reader = response.body?.getReader();
        if (!reader) {
          const text = await response.text();
          if (text.length > 512 * 1024) {
            reject(new Error('Page content size limit exceeded (max 500KB).'));
            return;
          }
          resolve(text);
          return;
        }

        let receivedBytes = 0;
        const chunks: Uint8Array[] = [];
        const maxBytes = 512 * 1024; // 500 KB limit

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            receivedBytes += value.length;
            if (receivedBytes > maxBytes) {
              controller.abort();
              reject(new Error('Page content size limit exceeded (max 500KB).'));
              return;
            }
            chunks.push(value);
          }
        }

        const bodyBuffer = Buffer.concat(chunks);
        const htmlText = bodyBuffer.toString('utf-8');
        resolve(htmlText);

      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            reject(new Error('URL request timed out after 6 seconds.'));
            return;
          }
          reject(new Error(err.message));
        } else {
          reject(new Error('An unknown error occurred while fetching source URL.'));
        }
      }
    };

    executeFetch(currentUrlStr);
  });
}
