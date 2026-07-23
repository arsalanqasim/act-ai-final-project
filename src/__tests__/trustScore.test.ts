import { describe, it, expect } from 'vitest';
import { calculateTrustScore } from '../utils/trustScore';

describe('utils/trustScore', () => {
  it('assigns high score & source-confirmed verification for fetched official domain', () => {
    const res = calculateTrustScore({
      sourceUrl: 'https://hec.gov.pk/scholarships/2026',
      applyUrl: 'https://hec.gov.pk/apply',
      sourceType: 'official',
      isUrlFetched: true,
      deadline: '2026-10-31',
      title: 'HEC Overseas PhD Scholarship 2026',
      organization: 'Higher Education Commission Pakistan',
      description: 'Fully funded MS and PhD scholarships for Pakistani university graduates.',
      techStackOrEligibility: ['GPA 3.0+', 'HAT Score 60+']
    });

    expect(res.score).toBeGreaterThanOrEqual(85);
    expect(res.trustTier).toBe('tier-1-official');
    expect(res.verificationState).toBe('source-confirmed');
    expect(res.label).toBe('Official Source');
    expect(res.domain).toBe('hec.gov.pk');
  });

  it('assigns approved platform status for fetched Devpost URLs', () => {
    const res = calculateTrustScore({
      sourceUrl: 'https://devpost.com/hackathons/agentic-ai-2026',
      applyUrl: 'https://devpost.com/hackathons/agentic-ai-2026',
      sourceType: 'approved-platform',
      isUrlFetched: true,
      deadline: '2026-08-25',
      title: 'Devpost Agentic AI Challenge 2026',
      organization: 'Devpost',
      description: 'Global AI hackathon with $40,000 cash prizes.',
      techStackOrEligibility: ['Python', 'Gemini API', 'React']
    });

    expect(res.score).toBeGreaterThanOrEqual(75);
    expect(res.verificationState).toBe('source-confirmed');
    expect(res.label).toBe('Approved Platform');
  });

  it('marks pasted text without URL fetch as Community Submitted / Unverified', () => {
    const res = calculateTrustScore({
      applyUrl: 'https://sample-link.com',
      isUrlFetched: false,
      deadline: '2026-09-01',
      title: 'Community Tech Meetup',
      organization: 'Local Tech Group',
      description: 'Community hosted developer meetup and project showcase.',
      techStackOrEligibility: ['JavaScript']
    });

    expect(res.verificationState).toBe('unverified');
    expect(res.label).toBe('Community Submitted');
  });

  it('caps score and sets state to Expired for past deadlines', () => {
    const res = calculateTrustScore({
      sourceUrl: 'https://devpost.com/hackathon/old-2024',
      applyUrl: 'https://devpost.com/apply',
      isUrlFetched: true,
      deadline: '2024-01-01',
      title: 'Old Hackathon 2024',
      organization: 'Devpost',
      description: 'Past hackathon event.',
      techStackOrEligibility: ['Python']
    });

    expect(res.verificationState).toBe('expired');
    expect(res.label).toBe('Expired');
    expect(res.score).toBeLessThanOrEqual(40);
  });
});
