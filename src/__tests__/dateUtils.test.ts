import { describe, it, expect } from 'vitest';
import { getDeadlineStatus } from '../utils/dateUtils';

describe('utils/dateUtils', () => {
  it('correctly identifies active future deadlines as Open', () => {
    const futureDate = '2026-12-31';
    const res = getDeadlineStatus(futureDate);
    expect(res.status).toBe('Open');
    expect(res.isExpired).toBe(false);
    expect(res.daysRemaining).toBeGreaterThan(7);
  });

  it('identifies deadlines within 7 days as Closing soon', () => {
    const now = new Date();
    const closingSoonDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
    const y = closingSoonDate.getFullYear();
    const m = String(closingSoonDate.getMonth() + 1).padStart(2, '0');
    const d = String(closingSoonDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const res = getDeadlineStatus(dateStr);
    expect(res.status).toBe('Closing soon');
    expect(res.isExpired).toBe(false);
    expect(res.daysRemaining).toBe(3);
  });

  it('identifies past dates as Expired', () => {
    const pastDate = '2024-05-15';
    const res = getDeadlineStatus(pastDate);
    expect(res.status).toBe('Expired');
    expect(res.isExpired).toBe(true);
    expect(res.daysRemaining).toBeLessThan(0);
  });

  it('handles missing or invalid date strings as Date unknown', () => {
    expect(getDeadlineStatus(undefined).status).toBe('Date unknown');
    expect(getDeadlineStatus('').status).toBe('Date unknown');
    expect(getDeadlineStatus('Flexible Deadline').status).toBe('Date unknown');
  });
});
