import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/db/knex.js', () => ({ db: {}, pingDb: vi.fn() }));

const a = await import('../src/services/automation.service.js');
const { GraphApiError } = await import('../src/integrations/instagramGraph.js');
const { campaignSchema, overlapWarnings } = await import('../src/services/campaign.service.js');

describe('renderTemplate', () => {
  it('fills placeholders and drops unknown ones', () => {
    expect(a.renderTemplate('Hi {{username}}! ❤️', { username: 'priya' })).toBe('Hi priya! ❤️');
    expect(a.renderTemplate('Hi {{ username }} {{unknown}}there', { username: 'kavya' })).toBe('Hi kavya there');
    expect(a.renderTemplate('Hi {{username}}', {})).toBe('Hi');
  });
});

describe('pickVariant', () => {
  it('avoids repeating the last reply when possible', () => {
    for (let i = 0; i < 20; i += 1) expect(a.pickVariant(['A', 'B'], 'A')).toBe('B');
  });
  it('handles one or zero variants', () => {
    expect(a.pickVariant(['Only'], 'Only')).toBe('Only');
    expect(a.pickVariant([], null)).toBeNull();
    expect(a.pickVariant(['  ', ''], null)).toBeNull();
  });
});

describe('randomDelayMs', () => {
  it('stays inside the configured range', () => {
    expect(a.randomDelayMs(20, 90, () => 0)).toBe(20_000);
    expect(a.randomDelayMs(20, 90, () => 0.999999)).toBeLessThanOrEqual(90_000);
    expect(a.randomDelayMs(30, 10, () => 0.5)).toBe(30_000); // max < min → min
  });
});

describe('private reply window (7 days)', () => {
  const now = Date.UTC(2026, 10, 14);
  it('allows recent comments and refuses older than 7 days', () => {
    expect(a.isWithinPrivateReplyWindow(new Date(now - 6 * 864e5), now)).toBe(true);
    expect(a.isWithinPrivateReplyWindow(new Date(now - 7 * 864e5 - 1), now)).toBe(false);
  });
});

describe('classifyGraphError', () => {
  it('retries rate limits, server and network errors', () => {
    expect(a.classifyGraphError(new GraphApiError('x', { status: 400, code: 4 })).retry).toBe(true);
    expect(a.classifyGraphError(new GraphApiError('x', { status: 503 })).retry).toBe(true);
    expect(a.classifyGraphError(new GraphApiError('timeout')).retry).toBe(true);
    expect(a.classifyGraphError(new Error('boom')).retry).toBe(true);
  });
  it('does not retry expired tokens or policy refusals', () => {
    expect(a.classifyGraphError(new GraphApiError('x', { status: 400, code: 190 }))).toMatchObject({ retry: false, auth: true });
    expect(a.classifyGraphError(new GraphApiError('outside window', { status: 400, code: 10, subcode: 2534022 }))).toMatchObject({ retry: false, ineligible: true });
  });
});

describe('overallStatus', () => {
  it.each([
    ['sent', 'sent', 'completed'],
    ['sent', 'none', 'completed'],
    ['sent', 'pending', 'queued'],
    ['sent', 'ineligible', 'partial'],
    ['failed', 'sent', 'partial'],
    ['failed', 'failed', 'failed'],
    ['none', 'ineligible', 'failed'],
  ])('public=%s private=%s → %s', (p, d, expected) => expect(a.overallStatus(p, d)).toBe(expected));
});

describe('campaignSchema', () => {
  const valid = {
    name: 'Bracelet', keywords: ['Price', ' price ', '#LINK!'], publicReplies: ['Check your DM ❤️', ''],
    sendDm: true, dmMessage: 'Hi {{username}}! The bracelet is ₹499.', appliesToAllMedia: false, mediaIds: ['r1'],
  };
  it('normalises and dedupes keywords, drops empty replies', () => {
    const r = campaignSchema.parse(valid);
    expect(r.keywords).toEqual(['price', 'link']);
    expect(r.publicReplies).toEqual(['Check your DM ❤️']);
    expect(r.matchMode).toBe('contains');
  });
  const fails = (over) => campaignSchema.safeParse({ ...valid, ...over }).error?.issues.map((i) => i.message).join(' | ');
  it('requires keywords, a Reel choice, a DM text when DM is on, and at least one action', () => {
    expect(fails({ keywords: ['  ', '!!'] })).toMatch(/at least one keyword/);
    expect(fails({ mediaIds: [] })).toMatch(/Pick at least one Reel/);
    expect(fails({ dmMessage: '' })).toMatch(/Write the DM message/);
    expect(fails({ publicReplies: [], sendDm: false })).toMatch(/public reply, a DM, or both/);
    expect(fails({ dmMessage: 'x'.repeat(1001) })).toMatch(/1000 characters/);
  });
  it('accepts "All Reels" without picking any', () => {
    expect(campaignSchema.safeParse({ ...valid, mediaIds: [], appliesToAllMedia: true }).success).toBe(true);
  });
});

describe('overlapWarnings', () => {
  const c = (id, over) => ({ id, accountId: 1, name: `C${id}`, isActive: true, priority: 0, appliesToAllMedia: false, mediaIds: ['r1'], keywords: ['price'], ...over });
  it('warns when two active campaigns share a keyword on the same Reel', () => {
    const [w] = overlapWarnings([c(1), c(2, { priority: 5 })]);
    expect(w.keywords).toEqual(['price']);
    expect(w.message).toMatch(/"C2" wins/);
  });
  it('stays quiet for different Reels, keywords or paused campaigns', () => {
    expect(overlapWarnings([c(1), c(2, { mediaIds: ['r2'] })])).toEqual([]);
    expect(overlapWarnings([c(1), c(2, { keywords: ['link'] })])).toEqual([]);
    expect(overlapWarnings([c(1), c(2, { isActive: false })])).toEqual([]);
  });
  it('treats "All Reels" as overlapping everything', () => {
    expect(overlapWarnings([c(1), c(2, { mediaIds: [], appliesToAllMedia: true })])).toHaveLength(1);
  });
});
