import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env, integrations } from '../config/env.js';
import { logger } from '../config/logger.js';
import { safeEqual } from '../utils/crypto.js';
import { badRequest } from '../utils/httpError.js';
import { buildAuthorizeUrl, REQUIRED_SCOPES } from '../integrations/instagramGraph.js';
import * as accounts from '../services/instagramAccount.service.js';
import * as media from '../services/media.service.js';
import { findAdminById } from '../services/auth.service.js';
import { logActivity } from '../services/activityLog.service.js';

// ─── OAuth "state" (CSRF protection for the connect flow) ───
// We put a random nonce in the `state` query param AND in a short-lived signed cookie.
// The callback only proceeds if both match, so an attacker can't trick your browser into
// connecting *their* Instagram account, and nobody can complete a flow you didn't start.
//
// The cookie is SameSite=Lax (not Strict) on purpose: the callback is a top-level redirect
// coming from instagram.com, and browsers don't send Strict cookies on cross-site navigation.
// That's also why the callback can't rely on the (Strict) session cookie.
export const OAUTH_STATE_COOKIE = 'igauto_oauth_state';
const STATE_TTL_SECONDS = 10 * 60;

function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/api/instagram/oauth',
    maxAge: STATE_TTL_SECONDS * 1000,
  };
}

const idParams = z.object({ id: z.coerce.number().int().positive() });
export const schemas = { idParams };

/** Step 1 (admin only): returns the Instagram login URL and sets the state cookie. */
export function startConnect(req, res) {
  if (!integrations.instagramLogin) {
    throw badRequest('Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET in backend/.env first (see docs/PHASE-2-META-SETUP.md).');
  }
  const nonce = crypto.randomBytes(24).toString('base64url');
  const signed = jwt.sign({ nonce, adm: req.admin.id }, env.JWT_SECRET, {
    expiresIn: STATE_TTL_SECONDS,
    audience: 'ig-oauth-state',
  });
  res.cookie(OAUTH_STATE_COOKIE, signed, stateCookieOptions());
  res.json({ url: buildAuthorizeUrl(nonce), scopes: REQUIRED_SCOPES });
}

/** Step 2 (public, state-protected): Instagram redirects the browser here with ?code=…&state=… */
export async function oauthCallback(req, res) {
  const back = (status, reason) => {
    const url = new URL('/settings', env.FRONTEND_URL);
    url.searchParams.set('instagram', status);
    if (reason) url.searchParams.set('reason', reason); // short fixed codes only — never echo Meta text
    res.redirect(303, url.toString());
  };

  const cookie = req.cookies?.[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE, { ...stateCookieOptions(), maxAge: undefined });

  const { code, state, error, error_reason: errorReason } = req.query;

  // Validate state FIRST — before trusting anything else in the request.
  let statePayload;
  try {
    statePayload = jwt.verify(cookie ?? '', env.JWT_SECRET, { audience: 'ig-oauth-state' });
  } catch {
    statePayload = null;
  }
  if (!statePayload || typeof state !== 'string' || !safeEqual(state, statePayload.nonce)) {
    await logActivity({ level: 'warn', scope: 'auth', message: 'Instagram OAuth callback rejected: invalid or expired state' });
    return back('error', 'state_invalid');
  }
  if (!(await findAdminById(statePayload.adm))) return back('error', 'state_invalid');

  if (error) {
    await logActivity({ level: 'warn', scope: 'instagram', message: `Instagram connection cancelled (${errorReason || error})` });
    return back('error', errorReason === 'user_denied' ? 'denied' : 'oauth_error');
  }
  if (typeof code !== 'string' || !code) return back('error', 'missing_code');

  try {
    const account = await accounts.connectFromAuthCode(code);
    // Best effort: pull the Reels list right away so campaigns can use it.
    media.syncMedia(account.id).catch((err) => logger.warn({ err: err.message }, 'Initial media sync failed'));
    return back(account.missingScopes.length ? 'partial' : 'connected');
  } catch (err) {
    await logActivity({
      level: 'error',
      scope: 'instagram',
      message: `Instagram connection failed: ${err.message}`,
      context: typeof err.toJSON === 'function' ? err.toJSON() : undefined,
    });
    return back('error', 'connect_failed');
  }
}

export async function list(_req, res) {
  res.json({ accounts: await accounts.listAccounts(), requiredScopes: REQUIRED_SCOPES });
}

export async function refreshToken(req, res) {
  res.json({ account: await accounts.refreshAccountToken(req.params.id) });
}

export async function syncMedia(req, res) {
  res.json(await media.syncMedia(req.params.id));
}

const mediaQuery = z.object({
  reelsOnly: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
schemas.mediaQuery = mediaQuery;

export async function listMedia(req, res) {
  await accounts.getAccount(req.params.id); // 404 if unknown
  res.json({ media: await media.listMedia(req.params.id, req.query) });
}

export async function disconnect(req, res) {
  await accounts.disconnectAccount(req.params.id);
  res.status(204).end();
}
