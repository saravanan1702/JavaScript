// Connected Instagram professional accounts: OAuth connect, encrypted token storage,
// token refresh and disconnect. Tokens are decrypted only in memory, only when needed,
// and never returned to the dashboard.
import { db } from '../db/knex.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { logActivity } from './activityLog.service.js';
import * as ig from '../integrations/instagramGraph.js';

const DAY_MS = 24 * 60 * 60 * 1000;
export const REFRESH_WHEN_DAYS_LEFT = 20; // refresh well before the ≈60-day expiry
export const MIN_TOKEN_AGE_MS = DAY_MS; // Meta: a token must be ≥ 24h old to be refreshed

/** Full OAuth completion: code → short-lived → long-lived token → profile → upsert. */
export async function connectFromAuthCode(code) {
  const { accessToken: shortToken, permissions } = await ig.exchangeCodeForToken(code);
  const { accessToken, expiresAt } = await ig.exchangeForLongLivedToken(shortToken);
  const profile = await ig.getProfile(accessToken);

  const now = new Date();
  const row = {
    ig_user_id: profile.igUserId,
    app_scoped_id: profile.appScopedId,
    username: profile.username,
    name: profile.name,
    profile_picture_url: profile.profilePictureUrl,
    account_type: profile.accountType,
    media_count: profile.mediaCount,
    access_token_enc: encrypt(accessToken),
    token_expires_at: expiresAt,
    token_refreshed_at: now,
    granted_scopes: permissions.length ? permissions.join(',') : null,
    status: 'active',
    status_detail: null,
    updated_at: now,
  };

  await db('instagram_accounts')
    .insert(row)
    .onConflict('ig_user_id')
    .merge(Object.keys(row).filter((k) => k !== 'ig_user_id'));

  const account = await db('instagram_accounts').where({ ig_user_id: profile.igUserId }).first();
  const pub = toPublicAccount(account);

  await logActivity({
    scope: 'instagram',
    message: `Connected Instagram account @${profile.username}`,
    context: { accountId: account.id, missingScopes: pub.missingScopes },
  });
  if (pub.missingScopes.length) {
    await logActivity({
      level: 'warn',
      scope: 'instagram',
      message: `@${profile.username} did not grant: ${pub.missingScopes.join(', ')}`,
      context: { accountId: account.id },
    });
  }
  return pub;
}

export async function listAccounts() {
  const rows = await db('instagram_accounts').orderBy('created_at', 'asc');
  return rows.map(toPublicAccount);
}

export async function getAccount(id) {
  const row = await db('instagram_accounts').where({ id }).first();
  if (!row) throw notFound('Instagram account not found');
  return row;
}

/** Returns the decrypted token for server-side Graph API calls. Throws if the account can't be used. */
export async function getAccessToken(id) {
  const row = await getAccount(id);
  if (row.status === 'disconnected' || !row.access_token_enc) {
    throw badRequest('This Instagram account is disconnected. Reconnect it in Settings.');
  }
  return decrypt(row.access_token_enc);
}

/** Refreshes one account's long-lived token (respecting Meta's 24h minimum age). */
export async function refreshAccountToken(id) {
  const row = await getAccount(id);
  if (row.status === 'disconnected') throw badRequest('Account is disconnected — reconnect it instead.');

  const age = Date.now() - new Date(row.token_refreshed_at ?? row.created_at).getTime();
  if (age < MIN_TOKEN_AGE_MS) {
    throw badRequest('Instagram only allows refreshing a token 24 hours after it was issued. Try again later.');
  }

  try {
    const { accessToken, expiresAt } = await ig.refreshLongLivedToken(decrypt(row.access_token_enc));
    await db('instagram_accounts').where({ id }).update({
      access_token_enc: encrypt(accessToken),
      token_expires_at: expiresAt,
      token_refreshed_at: new Date(),
      status: 'active',
      status_detail: null,
      updated_at: new Date(),
    });
    await logActivity({ scope: 'instagram', message: `Refreshed token for @${row.username}`, context: { accountId: id } });
  } catch (err) {
    await handleGraphError(id, err, `Token refresh failed for @${row.username}`);
    throw err;
  }
  return toPublicAccount(await getAccount(id));
}

/** Background job: refresh every active token that is old enough and nearing expiry. */
export async function refreshExpiringTokens() {
  const now = Date.now();
  const rows = await db('instagram_accounts').where({ status: 'active' });
  const due = rows.filter((r) => {
    const age = now - new Date(r.token_refreshed_at ?? r.created_at).getTime();
    const daysLeft = r.token_expires_at ? (new Date(r.token_expires_at).getTime() - now) / DAY_MS : 0;
    return age >= MIN_TOKEN_AGE_MS && daysLeft <= REFRESH_WHEN_DAYS_LEFT;
  });

  const results = { refreshed: 0, failed: 0 };
  for (const r of due) {
    try {
      await refreshAccountToken(r.id);
      results.refreshed += 1;
    } catch {
      results.failed += 1; // already logged + status updated
    }
  }
  return results;
}

/** Subscribes the app to comment + message webhooks for this account. */
export async function subscribeWebhooks(id) {
  const row = await getAccount(id);
  const token = await getAccessToken(id);
  try {
    await ig.subscribeAccountToWebhooks(token);
    const fields = await ig.getAccountSubscriptions(token).catch(() => ig.WEBHOOK_FIELDS);
    const ok = ig.WEBHOOK_FIELDS.every((f) => fields.includes(f));
    await db('instagram_accounts').where({ id }).update({ webhooks_subscribed: ok, updated_at: new Date() });
    await logActivity({ scope: 'webhook', message: `Subscribed @${row.username} to webhooks (${fields.join(', ') || 'none reported'})`, context: { accountId: id } });
    return { subscribed: ok, fields };
  } catch (err) {
    await db('instagram_accounts').where({ id }).update({ webhooks_subscribed: false, updated_at: new Date() });
    await handleGraphError(id, err, `Webhook subscription failed for @${row.username}`);
    throw err;
  }
}

/** Forgets the token locally. (To fully revoke, also remove the app in Instagram → Settings → Website permissions.) */
export async function disconnectAccount(id) {
  const row = await getAccount(id);
  await db('instagram_accounts').where({ id }).update({
    access_token_enc: '',
    token_expires_at: null,
    status: 'disconnected',
    status_detail: 'Disconnected by admin',
    webhooks_subscribed: false,
    updated_at: new Date(),
  });
  await logActivity({ scope: 'instagram', message: `Disconnected @${row.username}`, context: { accountId: id } });
}

/** Records a Graph API failure; marks the account as needing reconnection on auth errors. */
export async function handleGraphError(accountId, err, message) {
  if (err instanceof ig.GraphApiError && err.isAuthError) {
    await db('instagram_accounts').where({ id: accountId }).update({
      status: 'token_expired',
      status_detail: err.message.slice(0, 500),
      updated_at: new Date(),
    });
  }
  await logActivity({
    level: 'error',
    scope: 'graph_api',
    message: `${message}: ${err.message}`,
    context: { accountId, error: err instanceof ig.GraphApiError ? err.toJSON() : { message: err.message } },
  });
}

export function toPublicAccount(row) {
  const granted = ig.normaliseScopes(row.granted_scopes);
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at) : null;
  return {
    id: row.id,
    igUserId: row.ig_user_id,
    username: row.username,
    name: row.name,
    profilePictureUrl: row.profile_picture_url,
    accountType: row.account_type,
    mediaCount: row.media_count,
    status: row.status,
    statusDetail: row.status_detail,
    tokenExpiresAt: expiresAt,
    tokenDaysLeft: expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / DAY_MS)) : null,
    tokenRefreshedAt: row.token_refreshed_at,
    grantedScopes: granted,
    // If Meta didn't report scopes we can't tell — don't raise a false alarm.
    missingScopes: granted.length ? ig.REQUIRED_SCOPES.filter((s) => !granted.includes(s)) : [],
    webhooksSubscribed: Boolean(row.webhooks_subscribed),
    mediaSyncedAt: row.media_synced_at,
    connectedAt: row.created_at,
  };
}
