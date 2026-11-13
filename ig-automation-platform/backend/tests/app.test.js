import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock the DB layer so these API tests run without MySQL.
vi.mock('../src/db/knex.js', () => ({ db: {}, pingDb: vi.fn(async () => true) }));
vi.mock('../src/services/auth.service.js', () => ({
  verifyCredentials: vi.fn(),
  findAdminById: vi.fn(),
}));

const { createApp } = await import('../src/app.js');
const { pingDb } = await import('../src/db/knex.js');
const auth = await import('../src/services/auth.service.js');

const admin = { id: 1, email: 'owner@example.com', name: 'Owner', lastLoginAt: null };
const app = createApp();

beforeEach(() => vi.clearAllMocks());

describe('health', () => {
  it('returns ok when the DB is reachable', async () => {
    pingDb.mockResolvedValueOnce(true);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: true });
  });

  it('returns 503 when the DB is down', async () => {
    pingDb.mockResolvedValueOnce(false);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
  });

  it('protects the detailed status endpoint', async () => {
    const res = await request(app).get('/api/health/status');
    expect(res.status).toBe(401);
  });

  it('sends security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('auth', () => {
  it('rejects an invalid body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects wrong credentials', async () => {
    auth.verifyCredentials.mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('logs in, sets an httpOnly cookie, and the cookie authenticates /me', async () => {
    auth.verifyCredentials.mockResolvedValueOnce(admin);
    auth.findAdminById.mockResolvedValueOnce(admin);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'correct-horse-battery' });
    expect(login.status).toBe(200);
    const cookie = login.headers['set-cookie'][0];
    expect(cookie).toMatch(/igauto_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.admin.email).toBe('owner@example.com');
  });

  it('rejects a forged token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'igauto_session=forged.token.value');
    expect(res.status).toBe(401);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });
});
