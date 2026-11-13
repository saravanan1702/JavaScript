// Comment detection: store every comment once, then decide whether a campaign should act on it.
// Phase 4 plugs the actual public reply + private DM into `afterMatch`.
import { db } from '../db/knex.js';
import { getSettings } from './settings.service.js';
import { findBestCampaign } from '../utils/keywordMatcher.js';

/** Possible skip reasons, shown in the dashboard. */
export const SKIP_REASONS = {
  own_comment: 'Written by your own account',
  automation_disabled: 'Comment automation is turned off',
  reply_to_comment: 'Reply inside a comment thread (ignored by setting)',
  duplicate_commenter: 'This person was already handled on this Reel',
  account_inactive: 'Instagram account needs reconnecting',
};

/** entry.time is epoch seconds; tolerate milliseconds and junk by falling back to "now". */
export function toDate(entryTime) {
  const n = Number(entryTime);
  if (!Number.isFinite(n) || n <= 0) return new Date();
  const ms = n > 1e12 ? n : n * 1000;
  return ms < Date.UTC(2010, 0, 1) || ms > Date.now() + 86400000 ? new Date() : new Date(ms);
}

/**
 * Inserts the comment (idempotent on ig_comment_id).
 * @returns {Promise<{ comment: object, duplicate: boolean }>}
 */
export async function recordComment(account, value, entryTime) {
  const row = {
    account_id: account.id,
    ig_comment_id: String(value.id),
    ig_media_id: String(value.media?.id ?? ''),
    parent_comment_id: value.parent_id ? String(value.parent_id) : null,
    commenter_ig_id: value.from?.id ? String(value.from.id) : null,
    commenter_username: value.from?.username ?? null,
    text: value.text ?? null,
    commented_at: toDate(entryTime),
    status: 'received',
  };
  try {
    const [id] = await db('comments').insert(row);
    return { comment: { ...row, id }, duplicate: false };
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') throw err;
    return { comment: await db('comments').where({ ig_comment_id: row.ig_comment_id }).first(), duplicate: true };
  }
}

/** Active campaigns that apply to this Reel, with their keywords. */
export async function campaignsForMedia(accountId, igMediaId) {
  const campaigns = await db('campaigns as c')
    .where({ 'c.account_id': accountId, 'c.is_active': true })
    .andWhere((q) => {
      q.where('c.applies_to_all_media', true).orWhereExists(
        db('campaign_media as cm').whereRaw('cm.campaign_id = c.id').andWhere('cm.ig_media_id', igMediaId),
      );
    })
    .select('c.*');
  if (!campaigns.length) return [];

  const keywords = await db('campaign_keywords').whereIn('campaign_id', campaigns.map((c) => c.id));
  return campaigns.map((c) => ({ ...c, keywords: keywords.filter((k) => k.campaign_id === c.id).map((k) => k.keyword) }));
}

/**
 * Pure decision logic (unit-tested) — no DB access.
 * @returns {{ status: 'skipped'|'no_match'|'matched', reason?: string, campaign?: object, keyword?: string }}
 */
export function decide({ comment, account, settings, campaigns, alreadyHandled }) {
  const ownIds = [account.ig_user_id, account.app_scoped_id].filter(Boolean).map(String);
  const isOwn =
    (comment.commenter_ig_id && ownIds.includes(String(comment.commenter_ig_id))) ||
    (comment.commenter_username && account.username && comment.commenter_username.toLowerCase() === account.username.toLowerCase());
  if (isOwn) return { status: 'skipped', reason: 'own_comment' };
  if (!settings.comment_automation_enabled) return { status: 'skipped', reason: 'automation_disabled' };
  if (comment.parent_comment_id && !settings.reply_to_comment_replies) return { status: 'skipped', reason: 'reply_to_comment' };
  if (!comment.text) return { status: 'no_match' };

  const match = findBestCampaign(comment.text, campaigns);
  if (!match) return { status: 'no_match' };

  if (settings.one_automation_per_user_per_media && alreadyHandled) {
    return { status: 'skipped', reason: 'duplicate_commenter', campaign: match.campaign, keyword: match.keyword };
  }
  return { status: 'matched', campaign: match.campaign, keyword: match.keyword };
}

/** Full pipeline for one comment webhook. Returns the decision (for logging/tests). */
export async function handleCommentEvent(account, value, entryTime, { afterMatch } = {}) {
  const { comment, duplicate } = await recordComment(account, value, entryTime);
  if (duplicate && comment.status !== 'received') return { status: 'duplicate', commentId: comment.id };

  const [settings, campaigns] = await Promise.all([getSettings(), campaignsForMedia(account.id, comment.ig_media_id)]);

  const alreadyHandled = comment.commenter_ig_id
    ? Boolean(
        await db('comments')
          .where({ account_id: account.id, ig_media_id: comment.ig_media_id, commenter_ig_id: comment.commenter_ig_id })
          .whereNot({ id: comment.id })
          .whereIn('status', ['matched', 'queued', 'completed', 'partial'])
          .first('id'),
      )
    : false;

  const decision = decide({ comment, account, settings, campaigns, alreadyHandled });

  await db('comments').where({ id: comment.id }).update({
    status: decision.status,
    skip_reason: decision.reason ?? null,
    campaign_id: decision.campaign?.id ?? null,
    matched_keyword: decision.keyword ?? null,
    updated_at: new Date(),
  });

  if (decision.status === 'matched' && afterMatch) await afterMatch({ ...comment, campaign_id: decision.campaign.id }, decision, account);
  return { ...decision, commentId: comment.id };
}

// ─────────────── admin queries ───────────────

export async function listComments({ status, igMediaId, q, page = 1, pageSize = 25 }) {
  const query = db('comments as c').leftJoin('media as m', 'm.ig_media_id', 'c.ig_media_id').leftJoin('campaigns as k', 'k.id', 'c.campaign_id');
  if (status) query.where('c.status', status);
  if (igMediaId) query.where('c.ig_media_id', igMediaId);
  if (q) query.andWhere((w) => w.where('c.text', 'like', `%${q}%`).orWhere('c.commenter_username', 'like', `%${q}%`));

  const [{ total }] = await query.clone().count('* as total');
  const rows = await query
    .select(
      'c.id', 'c.ig_comment_id', 'c.ig_media_id', 'c.commenter_username', 'c.text', 'c.status', 'c.skip_reason',
      'c.matched_keyword', 'c.public_reply_status', 'c.private_reply_status', 'c.last_error', 'c.commented_at', 'c.created_at',
      'c.parent_comment_id', 'm.thumbnail_url', 'm.permalink', 'm.caption', 'k.name as campaign_name', 'c.campaign_id',
    )
    .orderBy('c.id', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    total: Number(total),
    page,
    pageSize,
    comments: rows.map((r) => ({
      id: r.id,
      igCommentId: r.ig_comment_id,
      igMediaId: r.ig_media_id,
      username: r.commenter_username,
      text: r.text,
      isReply: Boolean(r.parent_comment_id),
      status: r.status,
      skipReason: r.skip_reason,
      skipReasonText: r.skip_reason ? SKIP_REASONS[r.skip_reason] ?? r.skip_reason : null,
      matchedKeyword: r.matched_keyword,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name,
      publicReplyStatus: r.public_reply_status,
      privateReplyStatus: r.private_reply_status,
      lastError: r.last_error,
      commentedAt: r.commented_at ?? r.created_at,
      media: { thumbnailUrl: r.thumbnail_url, permalink: r.permalink, caption: r.caption },
    })),
  };
}

export async function commentStats() {
  const rows = await db('comments').select('status').count('* as n').groupBy('status');
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
}
