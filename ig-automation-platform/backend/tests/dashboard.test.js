import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/db/knex.js', () => ({ db: {}, pingDb: vi.fn() }));
const { tzOffset, localDay, buildRange, pctChange } = await import('../src/services/dashboard.service.js');

describe('time zone helpers', () => {
  it('computes offsets', () => {
    expect(tzOffset('Asia/Kolkata')).toBe('+05:30');
    expect(tzOffset('UTC')).toBe('+00:00');
    expect(tzOffset('America/New_York', new Date('2026-07-01T12:00:00Z'))).toBe('-04:00');
    expect(tzOffset('America/New_York', new Date('2026-12-01T12:00:00Z'))).toBe('-05:00');
  });
  it('gives the local calendar day (IST is ahead of UTC)', () => {
    expect(localDay(new Date('2026-11-18T20:00:00Z'), '+05:30')).toBe('2026-11-19'); // 1:30 AM IST
    expect(localDay(new Date('2026-11-18T18:00:00Z'), '+05:30')).toBe('2026-11-18'); // 11:30 PM IST
  });
});

describe('buildRange', () => {
  const now = new Date('2026-11-19T04:30:00Z'); // 10:00 IST
  it('"today" starts at local midnight', () => {
    const r = buildRange(1, now, '+05:30');
    expect(r.from.toISOString()).toBe('2026-11-18T18:30:00.000Z');
    expect(r.keys).toEqual(['2026-11-19']);
    expect(r.prevFrom.toISOString()).toBe('2026-11-17T18:30:00.000Z');
  });
  it('7 days = today plus the 6 days before, with matching previous period', () => {
    const r = buildRange(7, now, '+05:30');
    expect(r.keys).toEqual(['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19']);
    expect(r.from.toISOString()).toBe('2026-11-12T18:30:00.000Z');
    expect(r.prevTo).toEqual(r.from);
    expect(r.from.getTime() - r.prevFrom.getTime()).toBe(7 * 86_400_000);
  });
  it('produces one bucket per day for long ranges', () => {
    const r = buildRange(90, now, '+05:30');
    expect(r.keys).toHaveLength(90);
    expect(new Set(r.keys).size).toBe(90);
    expect(r.keys.at(-1)).toBe('2026-11-19');
  });
});

describe('pctChange', () => {
  it('handles growth, decline and missing baselines', () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(50, 100)).toBe(-50);
    expect(pctChange(5, 0)).toBeNull(); // no baseline → "new this period"
    expect(pctChange(0, 0)).toBe(0);
  });
});
