import { describe, it, expect } from 'vitest';
import { normalizeOpportunityUrl, generateOpportunityContentHash } from '../utils/duplicateHash';

describe('utils/duplicateHash', () => {
  describe('normalizeOpportunityUrl', () => {
    it('strips tracking parameters utm_source, ref, and trailing slashes', () => {
      const rawUrl = 'HTTPS://DEVPOST.COM/hackathons/agentic-ai-2026/?utm_source=linkedin&ref=newsletter#overview';
      const normalized = normalizeOpportunityUrl(rawUrl);
      expect(normalized).toBe('https://devpost.com/hackathons/agentic-ai-2026');
    });

    it('returns null for empty or invalid input', () => {
      expect(normalizeOpportunityUrl(null)).toBeNull();
      expect(normalizeOpportunityUrl('')).toBeNull();
    });
  });

  describe('generateOpportunityContentHash', () => {
    it('produces identical hash for equivalent titles, orgs, and URLs', () => {
      const hash1 = generateOpportunityContentHash(
        'Devpost Agentic AI Hackathon',
        'Devpost',
        'https://devpost.com/hackathons/agentic-ai-2026?utm_source=twitter'
      );

      const hash2 = generateOpportunityContentHash(
        '  devpost agentic ai hackathon  ',
        'DEVPOST',
        'https://devpost.com/hackathons/agentic-ai-2026'
      );

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^hash_[0-9a-f]{8}$/);
    });

    it('produces different hash for distinct opportunities', () => {
      const hash1 = generateOpportunityContentHash('Hackathon A', 'Org A', 'https://a.com');
      const hash2 = generateOpportunityContentHash('Hackathon B', 'Org B', 'https://b.com');
      expect(hash1).not.toBe(hash2);
    });
  });
});
