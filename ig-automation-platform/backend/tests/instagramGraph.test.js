import { describe, it, expect, vi, afterEach } from 'vitest';
import * as ig from '../src/integrations/instagramGraph.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('buildAuthorizeUrl', () => {
  it('requests exactly the required scopes with the registered redirect URI', () => {
    const url = new URL(ig.buildAuthorizeUrl('nonce123'));
    expect(url.origin + url.pathname).toBe('https://www.instagram.com/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('1234567890');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.com/api/instagram/oauth/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe('nonce123');
    expect(url.searchParams.get('scope').split(',')).toEqual(ig.REQUIRED_SCOPES);
  });
});

describe('token exchange', () => {
  it('posts the code (with "#_" stripped) and accepts the { data: [...] } shape', async () => {
    const fetchMock = vi.fn(async () => json({ data: [{ access_token: 'short', user_id: 17841400000000001, permissions: 'instagram_business_basic,instagram_business_manage_comments' }] }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await ig.exchangeCodeForToken('abc#_');
    expect(res).toEqual({ accessToken: 'short', permissions: ['instagram_business_basic', 'instagram_business_manage_comments'] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.instagram.com/oauth/access_token');
    const form = new URLSearchParams(init.body.toString());
    expect(form.get('code')).toBe('abc');
    expect(form.get('grant_type')).toBe('authorization_code');
    expect(form.get('client_secret')).toBe('test-instagram-app-secret');
  });

  it('accepts the flat shape with array permissions', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ access_token: 'short', permissions: ['instagram_business_basic'] })));
    expect((await ig.exchangeCodeForToken('x')).permissions).toEqual(['instagram_business_basic']);
  });

  it('exchanges for a long-lived token and computes expiry', async () => {
    const fetchMock = vi.fn(async () => json({ access_token: 'long', token_type: 'bearer', expires_in: 5184000 }));
    vi.stubGlobal('fetch', fetchMock);
    const { accessToken, expiresAt } = await ig.exchangeForLongLivedToken('short');
    expect(accessToken).toBe('long');
    const days = (expiresAt.getTime() - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(59.9);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/access_token');
    expect(url.searchParams.get('grant_type')).toBe('ig_exchange_token');
  });

  it('refreshes with ig_refresh_token', async () => {
    const fetchMock = vi.fn(async () => json({ access_token: 'newer', expires_in: 5184000 }));
    vi.stubGlobal('fetch', fetchMock);
    await ig.refreshLongLivedToken('long');
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/refresh_access_token');
    expect(url.searchParams.get('grant_type')).toBe('ig_refresh_token');
  });
});

describe('errors', () => {
  it('maps Graph errors and flags expired tokens', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: { message: 'Error validating access token', type: 'OAuthException', code: 190, fbtrace_id: 'abc' } }, 400)));
    const err = await ig.getProfile('bad').catch((e) => e);
    expect(err).toBeInstanceOf(ig.GraphApiError);
    expect(err.isAuthError).toBe(true);
    expect(err.isRateLimit).toBe(false);
    expect(err.message).not.toContain('bad'); // token never leaks into the message
  });

  it('flags rate limits', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: { message: 'limit', code: 4 } }, 400)));
    const err = await ig.getProfile('t').catch((e) => e);
    expect(err.isRateLimit).toBe(true);
  });

  it('maps OAuth endpoint errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error_type: 'OAuthException', code: 400, error_message: 'Invalid authorization code' }, 400)));
    const err = await ig.exchangeCodeForToken('x').catch((e) => e);
    expect(err.message).toBe('Invalid authorization code');
  });
});

describe('profile + media', () => {
  it('reads user_id as the professional account ID (string)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ id: '999', user_id: '17841400000000001', username: 'shop', account_type: 'BUSINESS' })));
    const p = await ig.getProfile('t');
    expect(p.igUserId).toBe('17841400000000001');
    expect(p.appScopedId).toBe('999');
  });

  it('maps media and returns the cursor, not the token-bearing next URL', async () => {
    const fetchMock = vi.fn(async () => json({
      data: [
        { id: '1', media_type: 'VIDEO', media_product_type: 'REELS', thumbnail_url: 'https://cdn/t.jpg', timestamp: '2026-05-01T12:00:00+0000', comments_count: 4 },
        { id: '2', media_type: 'IMAGE', media_product_type: 'FEED', media_url: 'https://cdn/i.jpg' },
      ],
      paging: { cursors: { after: 'CURSOR' }, next: 'https://graph.instagram.com/...&access_token=SECRET' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const page = await ig.listMediaPage('t', { limit: 2 });
    expect(page.nextCursor).toBe('CURSOR');
    expect(page.items[0]).toMatchObject({ igMediaId: '1', mediaProductType: 'REELS', thumbnailUrl: 'https://cdn/t.jpg', commentsCount: 4 });
    expect(page.items[0].postedAt.toISOString()).toBe('2026-05-01T12:00:00.000Z');
    expect(page.items[1].thumbnailUrl).toBe('https://cdn/i.jpg');
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/v26.0/me/media');
  });

  it('returns no cursor on the last page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ data: [], paging: { cursors: { after: 'X' } } })));
    expect((await ig.listMediaPage('t')).nextCursor).toBeNull();
  });
});
