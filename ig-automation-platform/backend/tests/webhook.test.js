import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

process.env.META_WEBHOOK_VERIFY_TOKEN = 'my-verify-token';

vi.mock('../src/db/knex.js', () => ({ db: {}, pingDb: vi.fn(async () => true) }));
vi.mock('../src/services/activityLog.service.js', () => ({ logActivity: vi.fn(async () => {}) }));
vi.mock('../src/services/webhook.service.js', async (orig) => ({
  ...(await orig()),
  ingestPayload: vi.fn(async () => ({ received: 1, stored: 1, duplicates: 0 })),
}));

const { createApp } = await import('../src/app.js');
const { ingestPayload, extractEvents } = await import('../src/services/webhook.service.js');
const { verifyMetaSignature, signMetaPayload } = await import('../src/utils/webhookSignature.js');
const { decide } = await import('../src/services/comment.service.js');

const app = createApp();
const SECRET = process.env.INSTAGRAM_APP_SECRET;

const commentPayload = {
  object: 'instagram',
  entry: [{
    id: '17841400000000001',
    time: 1794600000,
    changes: [{ field: 'comments', value: { id: '18000000000000001', text: 'Price?', from: { id: '9001', username: 'priya' }, media: { id: '18100000000000001', media_product_type: 'REELS' } } }],
  }],
};

beforeEach(() => vi.clearAllMocks());

describe('signature verification', () => {
  const raw = Buffer.from(JSON.stringify(commentPayload));
  it('accepts a correct signature', () => {
    expect(verifyMetaSignature(raw, signMetaPayload(raw, SECRET), [SECRET])).toBe(true);
  });
  it('accepts a signature made with the second (Meta app) secret', () => {
    expect(verifyMetaSignature(raw, signMetaPayload(raw, 'meta-secret'), [SECRET, 'meta-secret'])).toBe(true);
  });
  it('rejects wrong secret, tampered body, missing or malformed header', () => {
    expect(verifyMetaSignature(raw, signMetaPayload(raw, 'other'), [SECRET])).toBe(false);
    expect(verifyMetaSignature(Buffer.from(raw.toString().replace('Price', 'Free')), signMetaPayload(raw, SECRET), [SECRET])).toBe(false);
    expect(verifyMetaSignature(raw, undefined, [SECRET])).toBe(false);
    expect(verifyMetaSignature(raw, 'sha1=abc', [SECRET])).toBe(false);
    expect(verifyMetaSignature(raw, signMetaPayload(raw, SECRET), [undefined])).toBe(false);
  });
});

describe('GET /api/webhooks/instagram (verification)', () => {
  it('echoes the challenge when the verify token matches', async () => {
    const res = await request(app).get('/api/webhooks/instagram').query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'my-verify-token', 'hub.challenge': '1158201444' });
    expect(res.status).toBe(200);
    expect(res.text).toBe('1158201444');
  });
  it('rejects a wrong verify token', async () => {
    const res = await request(app).get('/api/webhooks/instagram').query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'nope', 'hub.challenge': '1' });
    expect(res.status).toBe(403);
  });
  it('does not echo arbitrary (script) input', async () => {
    const res = await request(app).get('/api/webhooks/instagram').query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'my-verify-token', 'hub.challenge': '<script>' });
    expect(res.status).toBe(403);
  });
});

describe('POST /api/webhooks/instagram', () => {
  const body = JSON.stringify(commentPayload);
  it('rejects unsigned requests and stores nothing', async () => {
    const res = await request(app).post('/api/webhooks/instagram').set('Content-Type', 'application/json').send(body);
    expect(res.status).toBe(401);
    expect(ingestPayload).not.toHaveBeenCalled();
  });
  it('rejects forged signatures', async () => {
    const res = await request(app).post('/api/webhooks/instagram').set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signMetaPayload(Buffer.from(body), 'attacker')).send(body);
    expect(res.status).toBe(401);
    expect(ingestPayload).not.toHaveBeenCalled();
  });
  it('accepts a correctly signed payload (signature checked on the exact raw bytes)', async () => {
    const res = await request(app).post('/api/webhooks/instagram').set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signMetaPayload(Buffer.from(body), SECRET)).send(body);
    expect(res.status).toBe(200);
    expect(ingestPayload).toHaveBeenCalledWith(commentPayload);
  });
  it('returns 500 (so Meta retries) when storage fails', async () => {
    ingestPayload.mockRejectedValueOnce(new Error('db down'));
    const res = await request(app).post('/api/webhooks/instagram').set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signMetaPayload(Buffer.from(body), SECRET)).send(body);
    expect(res.status).toBe(500);
  });
});

describe('extractEvents', () => {
  it('splits comment changes with a stable identity', () => {
    const [e] = extractEvents(commentPayload);
    expect(e).toMatchObject({ field: 'comments', igAccountId: '17841400000000001', identity: 'comments:18000000000000001', summary: '@priya: Price?' });
    expect(e.payload.value.text).toBe('Price?');
  });
  it('extracts DMs keyed by message id and flags echoes', () => {
    const events = extractEvents({
      object: 'instagram',
      entry: [{ id: '1', time: 1, messaging: [
        { sender: { id: '55' }, recipient: { id: '1' }, timestamp: 1, message: { mid: 'm_1', text: 'Is COD available?' } },
        { sender: { id: '1' }, recipient: { id: '55' }, timestamp: 2, message: { mid: 'm_2', text: 'Yes!', is_echo: true } },
      ] }],
    });
    expect(events.map((e) => e.identity)).toEqual(['messages:m_1', 'messages:m_2']);
    expect(events[0].summary).toBe('DM from 55: Is COD available?');
    expect(events[1].summary).toBe('Echo to 55: Yes!');
  });
  it('ignores non-instagram objects and garbage', () => {
    expect(extractEvents({ object: 'page', entry: [] })).toEqual([]);
    expect(extractEvents(null)).toEqual([]);
    expect(extractEvents({ object: 'instagram', entry: [{}] })).toEqual([]);
  });
});

describe('decide (comment automation rules)', () => {
  const account = { ig_user_id: '17841400000000001', app_scoped_id: '111', username: 'sparkle_jewels' };
  const settings = { comment_automation_enabled: true, reply_to_comment_replies: false, one_automation_per_user_per_media: true };
  const campaigns = [{ id: 7, priority: 0, match_mode: 'contains', applies_to_all_media: true, keywords: ['price', 'link'] }];
  const comment = { commenter_ig_id: '9001', commenter_username: 'priya', text: 'Price?', parent_comment_id: null };
  const run = (over = {}) => decide({ comment, account, settings, campaigns, alreadyHandled: false, ...over });

  it('matches a keyword', () => {
    expect(run()).toMatchObject({ status: 'matched', keyword: 'price', campaign: { id: 7 } });
  });
  it('never acts on our own comments (prevents reply loops)', () => {
    expect(run({ comment: { ...comment, commenter_ig_id: '17841400000000001' } }).reason).toBe('own_comment');
    expect(run({ comment: { ...comment, commenter_ig_id: '111' } }).reason).toBe('own_comment');
    expect(run({ comment: { ...comment, commenter_ig_id: null, commenter_username: 'Sparkle_Jewels' } }).reason).toBe('own_comment');
  });
  it('respects the automation switch', () => {
    expect(run({ settings: { ...settings, comment_automation_enabled: false } }).reason).toBe('automation_disabled');
  });
  it('skips replies inside threads unless enabled', () => {
    expect(run({ comment: { ...comment, parent_comment_id: '1' } }).reason).toBe('reply_to_comment');
    expect(run({ comment: { ...comment, parent_comment_id: '1' }, settings: { ...settings, reply_to_comment_replies: true } }).status).toBe('matched');
  });
  it('skips a commenter already handled on this Reel', () => {
    expect(run({ alreadyHandled: true })).toMatchObject({ status: 'skipped', reason: 'duplicate_commenter' });
    expect(run({ alreadyHandled: true, settings: { ...settings, one_automation_per_user_per_media: false } }).status).toBe('matched');
  });
  it('no match without keywords or campaigns', () => {
    expect(run({ comment: { ...comment, text: 'Beautiful 😍' } }).status).toBe('no_match');
    expect(run({ campaigns: [] }).status).toBe('no_match');
    expect(run({ comment: { ...comment, text: null } }).status).toBe('no_match');
  });
});

describe('comment timestamp parsing', async () => {
  const { toDate } = await import('../src/services/comment.service.js');
  it('handles seconds, milliseconds and junk', () => {
    expect(toDate(1794600000).toISOString()).toBe(new Date(1794600000 * 1000).toISOString());
    expect(toDate(1794600000123).getTime()).toBe(1794600000123);
    for (const junk of [undefined, 0, 1, 'abc', -5]) expect(Math.abs(toDate(junk).getTime() - Date.now())).toBeLessThan(5000);
  });
});
