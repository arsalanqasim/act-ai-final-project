import { describe, it, expect } from 'vitest';
import {
  isPrivateOrLoopbackIp,
  isLocalOrInternalHost,
  validateUrlSecurityAndDomain,
  extractReadableTextFromHtml
} from '../../api/utils/urlSecurity';

describe('api/utils/urlSecurity', () => {
  describe('isPrivateOrLoopbackIp', () => {
    it('detects IPv4 loopback, private, and metadata addresses', () => {
      expect(isPrivateOrLoopbackIp('127.0.0.1')).toBe(true);
      expect(isPrivateOrLoopbackIp('127.0.0.53')).toBe(true);
      expect(isPrivateOrLoopbackIp('10.0.0.1')).toBe(true);
      expect(isPrivateOrLoopbackIp('172.16.0.1')).toBe(true);
      expect(isPrivateOrLoopbackIp('172.31.255.255')).toBe(true);
      expect(isPrivateOrLoopbackIp('192.168.1.1')).toBe(true);
      expect(isPrivateOrLoopbackIp('169.254.169.254')).toBe(true); // AWS Metadata IP
      expect(isPrivateOrLoopbackIp('8.8.8.8')).toBe(false); // Public IP
      expect(isPrivateOrLoopbackIp('104.16.12.3')).toBe(false); // Public IP
    });

    it('detects IPv6 loopback and link-local addresses', () => {
      expect(isPrivateOrLoopbackIp('::1')).toBe(true);
      expect(isPrivateOrLoopbackIp('fe80::1')).toBe(true);
      expect(isPrivateOrLoopbackIp('fc00::1')).toBe(true);
    });
  });

  describe('isLocalOrInternalHost', () => {
    it('identifies internal and local hostnames', () => {
      expect(isLocalOrInternalHost('localhost')).toBe(true);
      expect(isLocalOrInternalHost('app.localhost')).toBe(true);
      expect(isLocalOrInternalHost('server.internal')).toBe(true);
      expect(isLocalOrInternalHost('mybox.local')).toBe(true);
      expect(isLocalOrInternalHost('devpost.com')).toBe(false);
    });
  });

  describe('validateUrlSecurityAndDomain', () => {
    it('accepts HTTPS URLs from approved registry domains', () => {
      const res = validateUrlSecurityAndDomain('https://devpost.com/hackathons/agentic-ai-2026');
      expect(res.isValid).toBe(true);
      expect(res.source?.domain).toBe('devpost.com');
    });

    it('rejects HTTP (non-HTTPS) URLs', () => {
      const res = validateUrlSecurityAndDomain('http://devpost.com/hackathons/agentic-ai-2026');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Only HTTPS URLs are allowed');
    });

    it('rejects credentials embedded in URL', () => {
      const res = validateUrlSecurityAndDomain('https://user:pass@devpost.com/hackathon');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('embedded user credentials');
    });

    it('rejects non-standard ports', () => {
      const res = validateUrlSecurityAndDomain('https://devpost.com:8080/hackathon');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Non-standard port');
    });

    it('blocks SSRF targeting localhost and private IPs', () => {
      const res1 = validateUrlSecurityAndDomain('https://localhost/admin');
      expect(res1.isValid).toBe(false);
      expect(res1.error).toContain('blocked');

      const res2 = validateUrlSecurityAndDomain('https://169.254.169.254/latest/meta-data');
      expect(res2.isValid).toBe(false);
      expect(res2.error).toContain('blocked');
    });

    it('rejects domains not in approved source registry', () => {
      const res = validateUrlSecurityAndDomain('https://unapproved-random-site.com/listing');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('not in the approved opportunity sources registry');
    });
  });

  describe('extractReadableTextFromHtml', () => {
    it('strips scripts, styles, nav, footer, and HTML tags cleanly', () => {
      const rawHtml = `
        <html>
          <head>
            <style>body { color: red; }</style>
            <script>console.log('secret');</script>
          </head>
          <body>
            <nav>Header Nav</nav>
            <h1>Devpost AI Challenge 2026</h1>
            <p>Build multi-agent workflows using Gemini APIs.</p>
            <footer>Footer Links</footer>
          </body>
        </html>
      `;

      const text = extractReadableTextFromHtml(rawHtml);
      expect(text).toContain('Devpost AI Challenge 2026');
      expect(text).toContain('Build multi-agent workflows using Gemini APIs.');
      expect(text).not.toContain('color: red');
      expect(text).not.toContain('console.log');
      expect(text).not.toContain('Header Nav');
      expect(text).not.toContain('Footer Links');
    });
  });
});
