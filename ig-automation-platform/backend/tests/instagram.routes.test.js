import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../src/db/knex.js', () => ({ db: {}, pingDb: vi.fn(async () => true) }));
vi.mock('../src/services/auth.service.js', () => ({
  verifyCredentials: vi.fn(),
  findAdminById: vi.fn(async (id) => (id === 1 ? { id: 1, email: 'o@example.com', name: 'O' } : null)),
}));
vi.mock('../src/services/activityLog.service.js', () => ({ logActivity: vi.fn(async () => {}) }));
vi.mock('../src/services/instagramAccount.service.js', () => ({
  connectFromAuthCode: vi.fn(),
  listAccounts: vi.fn(async () => []),
  getAccount: vi.fn(),
  refreshAccountToken: vi.fn(),
  disconnectAccount: vi.fn(),
  subscribeWebhooks: vi.fn(async () => ({ subscribed: true, fields: ['comments', 'messages'] })),
}));
vi.mock('../src/services/media.service.js', () => ({ syncMedia: vi.fn(async () => ({ synced: 0 })), listMedia: vi.fn() }));

const { createApp } = await import('../src/app.js');
const { signSession } = await import('../src/middleware/auth.js');
const accounts = await import('../src/services/instagramAccount.service.js');

const app = createApp();
const session = `igauto_session=${signSession({ id: 1, email: 'o@example.com' })}`;

beforeEach(() => vi.clearAllMocks());

/** Runs /connect and returns the nonce + state cookie, like a real browser would. */
async function startFlow() {
  const res = await request(app).get('/api/instagram/connect').set('Cookie', session);
  expect(res.status).toBe(200);
  const nonce = new URL(res.body.url).searchParams.get('state');
  const stateCookie = res.headers['set-cookie'].find((c) => c.startsWith('igauto_oauth_state='));
  return { nonce, stateCookie: stateCookie.split(';')[0], rawCookie: stateCookie };
}

describe('GET /api/instagram/connect', () => {
  it('requires admin login', async () => {
    expect((await request(app).get('/api/instagram/connect')).status).toBe(401);
  });

  it('returns the Instagram URL and a Lax, httpOnly, path-scoped state cookie', async () => {
    const { nonce, rawCookie } = await startFlow();
    expect(nonce).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(rawCookie).toMatch(/HttpOnly/);
    expect(rawCookie).toMatch(/SameSite=Lax/);
    expect(rawCookie).toMatch(/Path=\/api\/instagram\/oauth/);
  });
});

describe('GET /api/instagram/oauth/callback', () => {
  it('rejects a callback without the state cookie (CSRF / login-CSRF)', async () => {
    const res = await request(app).get('/api/instagram/oauth/callback?code=abc&state=whatever');
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('https://app.example.com/settings?instagram=error&reason=state_invalid');
    expect(accounts.connectFromAuthCode).not.toHaveBeenCalled();
  });

  it('rejects a mismatched state', async () => {
    const { stateCookie } = await startFlow();
    const res = await request(app).get('/api/instagram/oauth/callback?code=abc&state=WRONG').set('Cookie', stateCookie);
    expect(res.headers.location).toContain('reason=state_invalid');
    expect(accounts.connectFromAuthCode).not.toHaveBeenCalled();
  });

  it('rejects an expired state cookie', async () => {
    const expired = jwt.sign({ nonce: 'n', adm: 1, exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET, { audience: 'ig-oauth-state' });
    const res = await request(app).get('/api/instagram/oauth/callback?code=abc&state=n').set('Cookie', `igauto_oauth_state=${expired}`);
    expect(res.headers.location).toContain('reason=state_invalid');
  });

  it('handles the user pressing "Cancel" on Instagram', async () => {
    const { nonce, stateCookie } = await startFlow();
    const res = await request(app)
      .get(`/api/instagram/oauth/callback?error=access_denied&error_reason=user_denied&state=${nonce}`)
      .set('Cookie', stateCookie);
    expect(res.headers.location).toContain('instagram=error&reason=denied');
  });

  it('connects the account on a valid callback and clears the state cookie', async () => {
    accounts.connectFromAuthCode.mockResolvedValueOnce({ id: 5, missingScopes: [] });
    const { nonce, stateCookie } = await startFlow();
    const res = await request(app).get(`/api/instagram/oauth/callback?code=CODE123&state=${nonce}`).set('Cookie', stateCookie);
    expect(accounts.connectFromAuthCode).toHaveBeenCalledWith('CODE123');
    expect(res.headers.location).toBe('https://app.example.com/settings?instagram=connected');
    expect(res.headers['set-cookie'].join(';')).toMatch(/igauto_oauth_state=;/);
  });

  it('reports partial when permissions were not all granted', async () => {
    accounts.connectFromAuthCode.mockResolvedValueOnce({ id: 5, missingScopes: ['instagram_business_manage_messages'] });
    const { nonce, stateCookie } = await startFlow();
    const res = await request(app).get(`/api/instagram/oauth/callback?code=C&state=${nonce}`).set('Cookie', stateCookie);
    expect(res.headers.location).toContain('instagram=partial');
  });

  it('does not leak error details into the redirect', async () => {
    accounts.connectFromAuthCode.mockRejectedValueOnce(new Error('secret internal detail'));
    const { nonce, stateCookie } = await startFlow();
    const res = await request(app).get(`/api/instagram/oauth/callback?code=C&state=${nonce}`).set('Cookie', stateCookie);
    expect(res.headers.location).toBe('https://app.example.com/settings?instagram=error&reason=connect_failed');
  });
});

describe('account management routes', () => {
  it('are admin-only', async () => {
    expect((await request(app).get('/api/instagram/accounts')).status).toBe(401);
    expect((await request(app).delete('/api/instagram/accounts/1')).status).toBe(401);
  });

  it('validates the id', async () => {
    const res = await request(app).post('/api/instagram/accounts/abc/refresh-token').set('Cookie', session);
    expect(res.status).toBe(400);
  });

  it('lists accounts', async () => {
    const res = await request(app).get('/api/instagram/accounts').set('Cookie', session);
    expect(res.status).toBe(200);
    expect(res.body.requiredScopes).toHaveLength(3);
  });
});
