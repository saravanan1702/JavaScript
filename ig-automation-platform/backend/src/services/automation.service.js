// Phase 4: what happens after a comment matches a campaign.
//
//   matched ─▶ scheduleActions()
//                 ├─ job reply_comment   at now + random delay  → public reply under the comment
//                 └─ job private_reply   a few seconds later    → one DM to the commenter
//
// Every action re-checks the rules at send time (switches, campaign still active, account
// connected, Meta's 7-day private-reply window, hourly safety cap), so pausing a campaign
// during the delay really stops it. Each action is idempotent — retries never double-send.
import { db } from '../db/knex.js';
import { enqueue } from '../jobs/queue.js';
import { PermanentError, DeferError } from '../jobs/errors.js';
import * as ig from '../integrations/instagramGraph.js';
import { getSettings } from './settings.service.js';
import { getAccessToken, handleGraphError } from './instagramAccount.service.js';
import { logActivity } from './activityLog.service.js';

export const PRIVATE_REPLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // Meta: private reply within 7 days of the comment
const DM_GAP_MS = { min: 3_000, max: 8_000 }; // DM shortly after the public reply

// ─────────────────────────── pure helpers (unit-tested) ───────────────────────────

/** Replaces {{username}}, {{name}} etc. Unknown placeholders are removed rather than sent raw. */
export function renderTemplate(text, vars = {}) {
  return String(text ?? '')
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : ''))
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Random variant, avoiding an immediate repeat of the last one when there's a choice. */
export function pickVariant(variants, lastUsed, random = Math.random) {
  const list = (variants ?? []).map((v) => String(v).trim()).filter(Boolean);
  if (!list.length) return null;
  const pool = list.length > 1 && lastUsed ? list.filter((v) => v !== lastUsed) : list;
  return (pool.length ? pool : list)[Math.floor(random() * (pool.length || list.length))];
}

export function randomDelayMs(minSeconds, maxSeconds, random = Math.random) {
  const min = Math.max(0, Number(minSeconds) || 0);
  const max = Math.max(min, Number(maxSeconds) || min);
  return Math.round((min + random() * (max - min)) * 1000);
}

export function isWithinPrivateReplyWindow(commentedAt, now = Date.now()) {
  if (!commentedAt) return true;
  return now - new Date(commentedAt).getTime() < PRIVATE_REPLY_WINDOW_MS;
}

/**
 * How to treat a failed Graph call.
 *  - auth errors: account must reconnect → permanent
 *  - rate limits / server errors / network: retry with backoff
 *  - other 4xx: Meta refused this specific action (privacy settings, deleted comment,
 *    outside window, already replied…) → permanent; DMs are recorded as "ineligible"
 */
export function classifyGraphError(err) {
  if (!(err instanceof ig.GraphApiError)) return { retry: true, ineligible: false };
  if (err.isAuthError) return { retry: false, ineligible: false, auth: true };
  if (err.isRateLimit) return { retry: true, ineligible: false };
  if (!err.status || err.status >= 500) return { retry: true, ineligible: false };
  return { retry: false, ineligible: true };
}

/** Overall comment status from the two action statuses. */
export function overallStatus(publicStatus, privateStatus) {
  const intended = [publicStatus, privateStatus].filter((s) => s !== 'none');
  if (!intended.length) return 'completed';
  if (intended.some((s) => s === 'pending')) return 'queued';
  const sent = intended.filter((s) => s === 'sent').length;
  if (sent === intended.length) return 'completed';
  if (sent > 0) return 'partial';
  return 'failed';
}

// ─────────────────────────── scheduling ───────────────────────────

/** Called by comment detection when a comment matched a campaign. */
export async function scheduleActions(comment, decision) {
  const settings = await getSettings();
  const campaign = decision.campaign;
  const replies = parseJsonArray(campaign.public_replies);

  const wantPublic = replies.length > 0;
  const wantPrivate = Boolean(campaign.send_dm && settings.dm_automation_enabled && String(campaign.dm_message ?? '').trim());

  await db('comments').where({ id: comment.id }).update({
    status: wantPublic || wantPrivate ? 'queued' : 'completed',
    public_reply_status: wantPublic ? 'pending' : 'none',
    private_reply_status: wantPrivate ? 'pending' : 'none',
    updated_at: new Date(),
  });

  const delay = randomDelayMs(settings.reply_delay_min_seconds, settings.reply_delay_max_seconds);
  const replyAt = new Date(Date.now() + delay);
  if (wantPublic) {
    await enqueue('reply_comment', { commentId: comment.id }, { runAt: replyAt, dedupeKey: `reply_comment:${comment.id}` });
  }
  if (wantPrivate) {
    const dmAt = new Date(replyAt.getTime() + randomDelayMs(DM_GAP_MS.min / 1000, DM_GAP_MS.max / 1000));
    await enqueue('private_reply', { commentId: comment.id }, { runAt: dmAt, dedupeKey: `private_reply:${comment.id}` });
  }
}

// ─────────────────────────── job handlers ───────────────────────────

async function loadContext(commentId) {
  const comment = await db('comments').where({ id: commentId }).first();
  if (!comment) throw new PermanentError(`Comment ${commentId} not found`);
  const [account, campaign, settings] = await Promise.all([
    db('instagram_accounts').where({ id: comment.account_id }).first(),
    comment.campaign_id ? db('campaigns').where({ id: comment.campaign_id }).first() : null,
    getSettings(),
  ]);
  return { comment, account, campaign, settings };
}

/** Hourly safety cap per account (public replies + DMs). Over the cap → wait, don't fail. */
async function enforceHourlyCap(accountId, maxPerHour) {
  if (!maxPerHour || maxPerHour <= 0) return;
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n }] = await db('comments')
    .where({ account_id: accountId })
    .andWhere((q) => q.where('public_replied_at', '>=', since).orWhere('private_replied_at', '>=', since))
    .count('* as n');
  if (Number(n) >= maxPerHour) {
    throw new DeferError(`Hourly safety limit of ${maxPerHour} actions reached`, new Date(Date.now() + 10 * 60 * 1000));
  }
}

/**
 * Applies a status patch. `clearError` (e.g. 'Public reply') clears last_error only if that
 * error came from the same action — so a successful DM doesn't erase a failed reply's reason.
 */
async function finish(commentId, patch, { clearError } = {}) {
  const extra = clearError ? { last_error: db.raw('CASE WHEN last_error LIKE ? THEN NULL ELSE last_error END', [`${clearError}:%`]) } : {};
  await db('comments').where({ id: commentId }).update({ ...patch, ...extra, updated_at: new Date() });
  const c = await db('comments').where({ id: commentId }).first('public_reply_status', 'private_reply_status', 'skip_reason');
  const nothingDone = c.public_reply_status === 'none' && c.private_reply_status === 'none';
  await db('comments')
    .where({ id: commentId })
    .update({ status: nothingDone && c.skip_reason ? 'skipped' : overallStatus(c.public_reply_status, c.private_reply_status) });
}

/** Common pre-flight checks. Returns a skip reason, or null to proceed. */
function preflight({ comment, account, campaign, settings }) {
  if (!account || account.status !== 'active') return 'account_inactive';
  if (!settings.comment_automation_enabled) return 'automation_disabled';
  if (!campaign || !campaign.is_active) return 'campaign_paused';
  return null;
}

export async function handleReplyComment({ commentId }) {
  const ctx = await loadContext(commentId);
  const { comment, account, campaign, settings } = ctx;
  if (comment.public_reply_status !== 'pending') return; // already sent / cancelled → idempotent

  const skip = preflight(ctx);
  if (skip) {
    await finish(commentId, { public_reply_status: 'none', skip_reason: skip });
    return;
  }
  await enforceHourlyCap(account.id, settings.max_actions_per_hour);

  const last = await db('comments')
    .where({ campaign_id: campaign.id })
    .whereNotNull('public_reply_text')
    .orderBy('public_replied_at', 'desc')
    .first('public_reply_text');
  const variant = pickVariant(parseJsonArray(campaign.public_replies), last?.public_reply_text);
  const message = renderTemplate(variant, { username: comment.commenter_username });
  if (!message) {
    await finish(commentId, { public_reply_status: 'none' });
    return;
  }

  try {
    const token = await getAccessToken(account.id);
    const replyId = await ig.replyToComment(token, comment.ig_comment_id, message);
    await finish(commentId, {
      public_reply_status: 'sent',
      public_reply_id: replyId,
      public_reply_text: message.slice(0, 1000),
      public_replied_at: new Date(),
    }, { clearError: 'Public reply' });
  } catch (err) {
    await onActionError(ctx, err, 'public_reply_status', 'Public reply');
  }
}

export async function handlePrivateReply({ commentId }) {
  const ctx = await loadContext(commentId);
  const { comment, account, campaign, settings } = ctx;
  if (comment.private_reply_status !== 'pending') return; // one private reply per comment — never twice

  const skip = preflight(ctx) ?? (!settings.dm_automation_enabled ? 'dm_disabled' : null);
  if (skip) {
    await finish(commentId, { private_reply_status: 'none', skip_reason: skip });
    return;
  }
  if (!isWithinPrivateReplyWindow(comment.commented_at)) {
    await finish(commentId, { private_reply_status: 'ineligible', last_error: 'Private reply: comment is older than 7 days, so Meta no longer allows a private reply' });
    return;
  }
  await enforceHourlyCap(account.id, settings.max_actions_per_hour);

  const text = renderTemplate(campaign.dm_message, { username: comment.commenter_username });
  if (!text) {
    await finish(commentId, { private_reply_status: 'none' });
    return;
  }

  try {
    const token = await getAccessToken(account.id);
    const { recipientId, messageId } = await ig.sendPrivateReply(token, comment.ig_comment_id, text);
    await finish(commentId, { private_reply_status: 'sent', private_replied_at: new Date() }, { clearError: 'Private reply' });
    await recordOutboundDm({ account, comment, recipientId, messageId, text });
  } catch (err) {
    await onActionError(ctx, err, 'private_reply_status', 'Private reply');
  }
}

/** Saves the DM into the inbox (contacts + messages) so the conversation continues there (Phase 5/7). */
async function recordOutboundDm({ account, comment, recipientId, messageId, text }) {
  if (!recipientId) return;
  const now = new Date();
  await db('contacts')
    .insert({ account_id: account.id, igsid: recipientId, username: comment.commenter_username, last_outbound_at: now })
    .onConflict(['account_id', 'igsid'])
    .merge({ last_outbound_at: now, updated_at: now, ...(comment.commenter_username ? { username: comment.commenter_username } : {}) });
  const contact = await db('contacts').where({ account_id: account.id, igsid: recipientId }).first('id');
  await db('messages')
    .insert({
      contact_id: contact.id,
      direction: 'outbound',
      source: 'private_reply',
      ig_message_id: messageId,
      text,
      status: 'sent',
      comment_id: comment.id,
    })
    .onConflict('ig_message_id')
    .ignore();
}

async function onActionError({ comment, account }, err, statusField, label) {
  const kind = classifyGraphError(err);
  if (kind.retry) {
    await db('comments').where({ id: comment.id }).update({ last_error: `${label}: ${err.message}`.slice(0, 2000), updated_at: new Date() });
    throw err; // queue retries with backoff; onFinalFailure marks it failed if all retries fail
  }
  await handleGraphError(account.id, err, `${label} failed for comment ${comment.ig_comment_id}`);
  const status = statusField === 'private_reply_status' && kind.ineligible ? 'ineligible' : 'failed';
  await finish(comment.id, { [statusField]: status, last_error: `${label}: ${err.message}`.slice(0, 2000) });
}

/** Called when a reply job exhausted its retries. */
export async function markActionFailed(job, err) {
  const field = job.type === 'reply_comment' ? 'public_reply_status' : 'private_reply_status';
  const comment = await db('comments').where({ id: job.payload?.commentId }).first();
  if (!comment || comment[field] !== 'pending') return;
  const label = field === 'public_reply_status' ? 'Public reply' : 'Private reply';
  await finish(comment.id, { [field]: 'failed', last_error: `${label}: ${err.message}`.slice(0, 2000) });
}

/** Manual "Try again" from the dashboard for failed actions (never re-sends what was already sent). */
export async function retryFailedActions(commentId) {
  const comment = await db('comments').where({ id: commentId }).first();
  if (!comment) return null;
  const patch = {};
  const now = Date.now();
  if (comment.public_reply_status === 'failed') {
    patch.public_reply_status = 'pending';
    await enqueue('reply_comment', { commentId }, { dedupeKey: `reply_comment:${commentId}:retry:${now}` });
  }
  if (comment.private_reply_status === 'failed') {
    patch.private_reply_status = 'pending';
    await enqueue('private_reply', { commentId }, { dedupeKey: `private_reply:${commentId}:retry:${now}` });
  }
  if (Object.keys(patch).length) {
    await db('comments').where({ id: commentId }).update({ ...patch, status: 'queued', last_error: null, updated_at: new Date() });
  }
  await logActivity({ scope: 'automation', message: `Manual retry for comment #${commentId}`, context: { retried: Object.keys(patch) } });
  return Object.keys(patch);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const v = JSON.parse(value ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
