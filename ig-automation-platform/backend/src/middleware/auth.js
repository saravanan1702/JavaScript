import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../utils/httpError.js';

export const AUTH_COOKIE = 'igauto_session';

export function signSession(admin) {
  return jwt.sign({ sub: String(admin.id), email: admin.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'ig-automation',
    audience: 'ig-automation-admin',
  });
}

export function sessionCookieOptions() {
  return {
    httpOnly: true, // JS in the browser can't read it → XSS can't steal the session
    secure: env.isProd, // HTTPS only in production
    sameSite: 'strict', // blocks cross-site requests from carrying the cookie (CSRF)
    path: '/',
  };
}

/** Protects admin API routes. Accepts the httpOnly session cookie (dashboard) or a Bearer token (scripts). */
export function requireAdmin(req, _res, next) {
  const header = req.get('authorization');
  const token = req.cookies?.[AUTH_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return next(unauthorized('Not signed in'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'ig-automation',
      audience: 'ig-automation-admin',
    });
    req.admin = { id: Number(payload.sub), email: payload.email };
    return next();
  } catch {
    return next(unauthorized('Session expired, please sign in again'));
  }
}
