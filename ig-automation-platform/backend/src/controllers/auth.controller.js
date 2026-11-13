import { z } from 'zod';
import { AUTH_COOKIE, signSession, sessionCookieOptions } from '../middleware/auth.js';
import { verifyCredentials, findAdminById } from '../services/auth.service.js';
import { unauthorized } from '../utils/httpError.js';

export const loginSchema = z.object({
  email: z.email().max(191),
  password: z.string().min(1).max(200),
});

export async function login(req, res) {
  const admin = await verifyCredentials(req.body.email, req.body.password);
  if (!admin) throw unauthorized('Invalid email or password');

  res.cookie(AUTH_COOKIE, signSession(admin), sessionCookieOptions());
  res.json({ admin });
}

export function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE, sessionCookieOptions());
  res.status(204).end();
}

export async function me(req, res) {
  const admin = await findAdminById(req.admin.id);
  if (!admin) throw unauthorized('Account no longer exists');
  res.json({ admin });
}
