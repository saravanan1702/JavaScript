// Client for the official Instagram API with Instagram Login.
//   OAuth:       https://www.instagram.com/oauth/authorize
//   Code → token: https://api.instagram.com/oauth/access_token
//   Graph API:   https://graph.instagram.com/{version}/...
//
// Security notes
// - Access tokens go in query strings (that's how this API works), so URLs built here
//   are NEVER logged. Errors carry Meta's error fields only, never the URL.
// - Every call has a timeout so a slow Meta response can't hang a worker.
import { env, INSTAGRAM_REDIRECT_URI } from '../config/env.js';

export const IG_OAUTH_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
export const IG_OAUTH_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
export const IG_GRAPH_BASE = 'https://graph.instagram.com';

// Least privilege: only the permissions the platform actually uses.
export const REQUIRED_SCOPES = [
  'instagram_business_basic', // profile + media list
  'instagram_business_manage_comments', // read + reply to comments
  'instagram_business_manage_messages', // private replies + DMs
];

const TIMEOUT_MS = 15_000;

export class GraphApiError extends Error {
  constructor(message, { status, code, subcode, type, fbtraceId } = {}) {
    super(message);
    this.name = 'GraphApiError';
    this.status = status;
    this.code = code;
    this.subcode = subcode;
    this.type = type;
    this.fbtraceId = fbtraceId;
  }

  /** Token expired / revoked / password changed → the account must be reconnected. */
  get isAuthError() {
    return this.code === 190 || (this.type === 'OAuthException' && this.status === 401);
  }

  /** Throttled by Meta → back off and retry later. */
  get isRateLimit() {
    return [4, 17, 32, 613].includes(this.code) || this.status === 429;
  }

  toJSON() {
    return { message: this.message, status: this.status, code: this.code, subcode: this.subcode, type: this.type, fbtraceId: this.fbtraceId };
  }
}

function requireAppCredentials() {
  if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) {
    throw new GraphApiError('INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET must be set in backend/.env');
  }
}

async function send(url, init = {}) {
  let res;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new GraphApiError(
      err.name === 'TimeoutError' ? 'Instagram API timed out' : `Network error calling Instagram API: ${err.message}`,
    );
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error || body.error_type) {
    // Graph errors: { error: { message, type, code, error_subcode, fbtrace_id } }
    // OAuth endpoint errors: { error_type, code, error_message }
    const e = body.error ?? {};
    throw new GraphApiError(e.message || body.error_message || `Instagram API error (HTTP ${res.status})`, {
      status: res.status,
      code: e.code ?? body.code,
      subcode: e.error_subcode,
      type: e.type ?? body.error_type,
      fbtraceId: e.fbtrace_id,
    });
  }
  return body;
}

function graphUrl(path, params) {
  const url = new URL(`${IG_GRAPH_BASE}/${env.META_GRAPH_API_VERSION}/${path.replace(/^\//, '')}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  return url;
}

/** GET on the versioned Graph API. */
export function graphGet(path, accessToken, params = {}) {
  return send(graphUrl(path, { ...params, access_token: accessToken }));
}

/** POST (form-encoded) on the versioned Graph API. Used from Phase 3/4 for replies + messages. */
export function graphPost(path, accessToken, body = {}) {
  return send(graphUrl(path, { access_token: accessToken }), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─────────────────────────── OAuth ───────────────────────────

/** URL the admin's browser is sent to so they can log in to Instagram and approve the permissions. */
export function buildAuthorizeUrl(state) {
  requireAppCredentials();
  const url = new URL(IG_OAUTH_AUTHORIZE_URL);
  url.searchParams.set('client_id', env.INSTAGRAM_APP_ID);
  url.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', REQUIRED_SCOPES.join(','));
  url.searchParams.set('state', state);
  url.searchParams.set('enable_fb_login', '0'); // Instagram login only
  url.searchParams.set('force_reauth', 'true'); // always show the login/consent screen
  return url.toString();
}

/** Exchanges the one-time `code` for a short-lived (≈1 hour) user token. */
export async function exchangeCodeForToken(code) {
  requireAppCredentials();
  const body = await send(IG_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.INSTAGRAM_APP_ID,
      client_secret: env.INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code: cleanAuthCode(code),
    }),
  });

  // Meta has returned both { access_token, permissions } and { data: [{ ... }] } — accept either.
  // (We deliberately ignore the numeric user_id here: it can exceed JS's safe integer range.
  //  The account ID is read as a string from /me instead.)
  const data = Array.isArray(body.data) ? body.data[0] : body;
  if (!data?.access_token) throw new GraphApiError('Instagram did not return an access token');
  return {
    accessToken: data.access_token,
    permissions: normaliseScopes(data.permissions),
  };
}

/** Exchanges a short-lived token for a long-lived (≈60 day) token. */
export async function exchangeForLongLivedToken(shortLivedToken) {
  requireAppCredentials();
  const url = new URL(`${IG_GRAPH_BASE}/access_token`);
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_secret', env.INSTAGRAM_APP_SECRET);
  url.searchParams.set('access_token', shortLivedToken);
  return toTokenResult(await send(url));
}

/**
 * Extends a long-lived token by another ≈60 days. Meta only allows this when the token
 * is at least 24 hours old and not yet expired — the refresher job respects both rules.
 */
export async function refreshLongLivedToken(longLivedToken) {
  const url = new URL(`${IG_GRAPH_BASE}/refresh_access_token`);
  url.searchParams.set('grant_type', 'ig_refresh_token');
  url.searchParams.set('access_token', longLivedToken);
  return toTokenResult(await send(url));
}

// ─────────────────────────── Account + media ───────────────────────────

/**
 * Profile of the connected professional account.
 * `user_id` is the Instagram professional account ID — the same ID that webhooks send
 * as `entry[].id`. `id` is the app-scoped ID. Both are returned as strings.
 */
export async function getProfile(accessToken) {
  const p = await graphGet('me', accessToken, {
    fields: 'id,user_id,username,name,account_type,profile_picture_url,media_count',
  });
  return {
    igUserId: String(p.user_id ?? p.id),
    appScopedId: p.id ? String(p.id) : null,
    username: p.username,
    name: p.name ?? null,
    accountType: p.account_type ?? null,
    profilePictureUrl: p.profile_picture_url ?? null,
    mediaCount: p.media_count ?? null,
  };
}

const MEDIA_FIELDS = 'id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,comments_count';

/** One page of the account's media, newest first. Pass `after` (cursor) for the next page. */
export async function listMediaPage(accessToken, { limit = 50, after } = {}) {
  const body = await graphGet('me/media', accessToken, { fields: MEDIA_FIELDS, limit, after });
  return {
    items: (body.data ?? []).map((m) => ({
      igMediaId: String(m.id),
      mediaType: m.media_type ?? null,
      mediaProductType: m.media_product_type ?? null,
      caption: m.caption ?? null,
      permalink: m.permalink ?? null,
      // Reels/videos have a thumbnail_url; images use media_url as their own thumbnail.
      thumbnailUrl: m.thumbnail_url ?? (m.media_type === 'IMAGE' ? m.media_url : null) ?? null,
      postedAt: parseMetaDate(m.timestamp),
      commentsCount: m.comments_count ?? null,
    })),
    // Follow the cursor, not paging.next (that URL embeds the access token).
    nextCursor: body.paging?.next ? body.paging?.cursors?.after ?? null : null,
  };
}

// ─────────────────────────── helpers ───────────────────────────

/** Instagram sometimes appends "#_" to the code in the redirect URL. */
export function cleanAuthCode(code) {
  return String(code).replace(/#_$/, '');
}

export function normaliseScopes(permissions) {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions.map(String);
  return String(permissions).split(',').map((s) => s.trim()).filter(Boolean);
}

function toTokenResult(body) {
  if (!body.access_token) throw new GraphApiError('Instagram did not return an access token');
  const expiresIn = Number(body.expires_in) || 0;
  return {
    accessToken: body.access_token,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
  };
}

/** Meta timestamps look like "2026-05-01T12:00:00+0000" — normalise the offset so Date parses it everywhere. */
export function parseMetaDate(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isNaN(d.getTime()) ? null : d;
}
