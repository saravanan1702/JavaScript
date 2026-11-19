import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/db/knex.js', () => ({ db: {}, pingDb: vi.fn() }));
const { windowInfo } = await import('../src/services/inbox.service.js');
const { median, toHeatmap } = await import('../src/services/analytics.service.js');

describe('windowInfo (Meta 24-hour window)', () => {
  const now = Date.UTC(2026, 10, 20, 12);
  it('is open with time left after a recent customer message', () => {
    const w = windowInfo(new Date(now - 6 * 3600e3), now);
    expect(w.open).toBe(true);
    expect(w.minutesLeft).toBe(18 * 60);
  });
  it('is closed after 24 hours or when the customer never wrote', () => {
    expect(windowInfo(new Date(now - 24 * 3600e3 - 1000), now).open).toBe(false);
    expect(windowInfo(null, now)).toEqual({ open: false, closesAt: null, minutesLeft: 0 });
  });
});

describe('median', () => {
  it('handles odd, even, empty and junk', () => {
    expect(median([30, 10, 20])).toBe(20);
    expect(median([10, 20, 30, 41])).toBe(25);
    expect(median([])).toBeNull();
    expect(median([NaN, 5])).toBe(5);
  });
});

describe('toHeatmap', () => {
  it('maps MySQL DAYOFWEEK (1=Sunday) to Monday-first rows', () => {
    const grid = toHeatmap([{ dow: 2, hour: 9, n: 4 }, { dow: 1, hour: 21, n: 7 }, { dow: 7, hour: 0, n: 1 }]);
    expect(grid).toHaveLength(7);
    expect(grid[0][9]).toBe(4); // Monday 09:00
    expect(grid[6][21]).toBe(7); // Sunday 21:00
    expect(grid[5][0]).toBe(1); // Saturday 00:00
  });
});
