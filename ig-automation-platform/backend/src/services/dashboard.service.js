// Dashboard numbers for a date range (last N days, in the shop's time zone), compared with
// the previous period of the same length. Everything is computed from the same tables the
// automation writes to, so the dashboard can never disagree with the Comments/Logs pages.
import { db } from '../db/knex.js';
import { env } from '../config/env.js';

const DAY_MS = 86_400_000;

// ─────────────── time helpers (pure, unit-tested) ───────────────

/** UTC offset of a time zone at a given instant, e.g. "+05:30". */
export function tzOffset(timeZone, at = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(at);
  const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+-]\d{2}):?(\d{2})?/.exec(name);
  return m ? `${m[1]}:${m[2] ?? '00'}` : '+00:00';
}

function offsetMinutes(offset) {
  const [, sign, h, m] = /([+-])(\d{2}):(\d{2})/.exec(offset);
  return (sign === '-' ? -1 : 1) * (Number(h) * 60 + Number(m));
}

/** "YYYY-MM-DD" of an instant in the given offset. */
export function localDay(date, offset) {
  return new Date(date.getTime() + offsetMinutes(offset) * 60_000).toISOString().slice(0, 10);
}

/**
 * Range = the last `days` calendar days including today, in local time.
 * Returns UTC instants for SQL plus the list of local day keys for chart buckets.
 */
export function buildRange(days, now = new Date(), offset = '+00:00') {
  const today = localDay(now, offset);
  const startLocalMidnightUtc = Date.parse(`${today}T00:00:00Z`) - offsetMinutes(offset) * 60_000 - (days - 1) * DAY_MS;
  const from = new Date(startLocalMidnightUtc);
  const prevFrom = new Date(startLocalMidnightUtc - days * DAY_MS);
  const keys = Array.from({ length: days }, (_, i) => localDay(new Date(startLocalMidnightUtc + i * DAY_MS + 3_600_000), offset));
  return { from, to: now, prevFrom, prevTo: from, keys };
}

/** Change vs previous period, as a whole percentage (null when there's no baseline). */
export function pctChange(current, previous) {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─────────────── queries ───────────────

const n = (rows, key = 'n') => Number(rows?.[0]?.[key] ?? 0);

async function periodTotals(from, to) {
  const inRange = (q, col) => q.where(col, '>=', from).andWhere(col, '<', to);
  const [comments, matched, replies, privateReplies, dms, aiReplies, enquiries, outcomes, failedEvents] = await Promise.all([
    inRange(db('comments'), 'created_at').count('* as n'),
    inRange(db('comments').whereNotNull('campaign_id'), 'created_at').count('* as n'),
    inRange(db('comments'), 'public_replied_at').count('* as n'),
    inRange(db('comments'), 'private_replied_at').count('* as n'),
    inRange(db('messages').where({ direction: 'outbound', status: 'sent' }).whereIn('source', ['private_reply', 'ai']), 'created_at').count('* as n'),
    inRange(db('messages').where({ source: 'ai', status: 'sent' }), 'created_at').count('* as n'),
    inRange(db('messages').where({ direction: 'inbound' }), 'created_at').countDistinct('contact_id as n'),
    inRange(db('comments').whereNotNull('campaign_id'), 'created_at').select('status').count('* as n').groupBy('status'),
    inRange(db('webhook_events').where({ status: 'failed' }), 'received_at').count('* as n'),
  ]);
  const byStatus = Object.fromEntries(outcomes.map((r) => [r.status, Number(r.n)]));
  const finished = (byStatus.completed ?? 0) + (byStatus.partial ?? 0) + (byStatus.failed ?? 0);
  return {
    comments: n(comments),
    matched: n(matched),
    publicReplies: n(replies),
    privateReplies: n(privateReplies),
    dmsSent: n(dms),
    aiReplies: n(aiReplies),
    enquiries: n(enquiries),
    successful: byStatus.completed ?? 0,
    successRate: finished ? Math.round(((byStatus.completed ?? 0) / finished) * 100) : null,
    failedWebhooks: n(failedEvents),
    outcomes: {
      completed: byStatus.completed ?? 0,
      partial: byStatus.partial ?? 0,
      failed: byStatus.failed ?? 0,
      skipped: byStatus.skipped ?? 0,
      queued: (byStatus.queued ?? 0) + (byStatus.matched ?? 0),
    },
  };
}

async function dailySeries(range, offset) {
  const day = (col) => db.raw(`DATE_FORMAT(CONVERT_TZ(${col}, '+00:00', ?), '%Y-%m-%d') as day`, [offset]);
  const group = (q, col) =>
    q.where(col, '>=', range.from).andWhere(col, '<', range.to).select(day(col)).count('* as n').groupByRaw('day');

  const [comments, replies, dms] = await Promise.all([
    group(db('comments'), 'created_at'),
    group(db('comments'), 'public_replied_at'),
    group(db('messages').where({ direction: 'outbound', status: 'sent' }).whereIn('source', ['private_reply', 'ai']), 'created_at'),
  ]);
  const map = (rows) => new Map(rows.map((r) => [r.day, Number(r.n)]));
  const [c, r, d] = [map(comments), map(replies), map(dms)];
  return range.keys.map((key) => ({ day: key, comments: c.get(key) ?? 0, replies: r.get(key) ?? 0, dms: d.get(key) ?? 0 }));
}

async function topCampaigns(range) {
  const rows = await db('comments as c')
    .join('campaigns as k', 'k.id', 'c.campaign_id')
    .where('c.created_at', '>=', range.from)
    .andWhere('c.created_at', '<', range.to)
    .select('k.id', 'k.name', 'k.is_active')
    .count('* as matched')
    .sum({ dms: db.raw("CASE WHEN c.private_reply_status = 'sent' THEN 1 ELSE 0 END") })
    .groupBy('k.id', 'k.name', 'k.is_active')
    .orderBy('matched', 'desc')
    .limit(5);
  return rows.map((r) => ({ id: r.id, name: r.name, isActive: Boolean(r.is_active), matched: Number(r.matched), dms: Number(r.dms ?? 0) }));
}

async function topKeywords(range) {
  const rows = await db('comments')
    .whereNotNull('matched_keyword')
    .andWhere('created_at', '>=', range.from)
    .andWhere('created_at', '<', range.to)
    .select('matched_keyword as keyword')
    .count('* as n')
    .groupBy('matched_keyword')
    .orderBy('n', 'desc')
    .limit(6);
  return rows.map((r) => ({ keyword: r.keyword, count: Number(r.n) }));
}

export async function recentConversations(limit = 6) {
  const latest = db('messages').select('contact_id').max('id as last_id').groupBy('contact_id').as('lm');
  const rows = await db('contacts as c')
    .join(latest, 'lm.contact_id', 'c.id')
    .join('messages as m', 'm.id', 'lm.last_id')
    .select('c.id', 'c.username', 'c.name', 'c.needs_attention', 'c.attention_reason', 'c.ai_paused', 'c.unread_count',
      'm.text', 'm.direction', 'm.source', 'm.created_at')
    .orderBy('m.created_at', 'desc')
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    name: r.name,
    needsAttention: Boolean(r.needs_attention),
    attentionReason: r.attention_reason,
    aiPaused: Boolean(r.ai_paused),
    unread: r.unread_count,
    lastMessage: { text: r.text, direction: r.direction, source: r.source, at: r.created_at },
  }));
}

async function attention() {
  const [needs, paused, failedAll, errors] = await Promise.all([
    db('contacts').where({ needs_attention: true }).count('* as n'),
    db('contacts').where({ ai_paused: true }).count('* as n'),
    db('webhook_events').where({ status: 'failed' }).count('* as n'),
    db('activity_logs').where({ level: 'error' }).orderBy('id', 'desc').limit(5).select('id', 'scope', 'message', 'created_at'),
  ]);
  return {
    conversationsNeedingYou: n(needs),
    aiPausedContacts: n(paused),
    failedWebhooksTotal: n(failedAll),
    recentErrors: errors.map((e) => ({ id: e.id, scope: e.scope, message: e.message, at: e.created_at })),
  };
}

async function aiUsage(range) {
  const rows = await db('messages')
    .whereNotNull('ai_meta')
    .andWhere('created_at', '>=', range.from)
    .andWhere('created_at', '<', range.to)
    .select(
      db.raw("COALESCE(SUM(JSON_VALUE(ai_meta, '$.inputTokens')), 0) as input"),
      db.raw("COALESCE(SUM(JSON_VALUE(ai_meta, '$.outputTokens')), 0) as output"),
      db.raw("COALESCE(SUM(JSON_VALUE(ai_meta, '$.cacheReadTokens')), 0) as cache_read"),
      // MySQL returns JSON booleans as 'true', MariaDB as '1': accept both.
      db.raw("SUM(CASE WHEN JSON_VALUE(ai_meta, '$.needsHuman') IN ('true', '1') THEN 1 ELSE 0 END) as handoffs"),
      db.raw('COUNT(*) as replies'),
    );
  const r = rows[0] ?? {};
  return {
    replies: Number(r.replies ?? 0),
    handoffs: Number(r.handoffs ?? 0),
    inputTokens: Number(r.input ?? 0),
    outputTokens: Number(r.output ?? 0),
    cacheReadTokens: Number(r.cache_read ?? 0),
  };
}

export async function getDashboard({ days = 7, now = new Date() } = {}) {
  const offset = tzOffset(env.APP_TIMEZONE, now);
  const range = buildRange(days, now, offset);

  const [current, previous, series, campaigns, keywords, conversations, attn, ai, activeCampaigns] = await Promise.all([
    periodTotals(range.from, range.to),
    periodTotals(range.prevFrom, range.prevTo),
    dailySeries(range, offset),
    topCampaigns(range),
    topKeywords(range),
    recentConversations(),
    attention(),
    aiUsage(range),
    db('campaigns').where({ is_active: true }).count('* as n'),
  ]);

  const change = Object.fromEntries(
    ['comments', 'matched', 'publicReplies', 'dmsSent', 'enquiries', 'successful', 'failedWebhooks', 'aiReplies'].map((k) => [k, pctChange(current[k], previous[k])]),
  );

  return {
    range: { days, from: range.from, to: range.to, timeZone: env.APP_TIMEZONE },
    totals: { ...current, activeCampaigns: n(activeCampaigns) },
    previous,
    change,
    series,
    funnel: [
      { stage: 'Comments received', value: current.comments },
      { stage: 'Matched a keyword', value: current.matched },
      { stage: 'Public reply sent', value: current.publicReplies },
      { stage: 'Private reply (DM) sent', value: current.privateReplies },
    ],
    outcomes: current.outcomes,
    topCampaigns: campaigns,
    topKeywords: keywords,
    recentConversations: conversations,
    attention: attn,
    ai,
  };
}
