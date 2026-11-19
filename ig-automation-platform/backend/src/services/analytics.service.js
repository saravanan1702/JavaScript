// Deeper analytics for the Analytics page: which Reels convert, when customers comment,
// what they ask the AI, how fast replies go out, and how each campaign performs.
import { db } from '../db/knex.js';
import { env } from '../config/env.js';
import { tzOffset, buildRange } from './dashboard.service.js';

/** Pure: median of numbers (null for an empty list). */
export function median(values) {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
}

/** Pure: 7×24 grid (Mon..Sun × 0..23) from MySQL DAYOFWEEK (1=Sun..7=Sat) + HOUR rows. */
export function toHeatmap(rows) {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const r of rows) {
    const mondayFirst = (Number(r.dow) + 5) % 7; // 2(Mon)→0 … 1(Sun)→6
    grid[mondayFirst][Number(r.hour)] += Number(r.n);
  }
  return grid;
}

export async function getAnalytics({ days = 30, now = new Date() } = {}) {
  const offset = tzOffset(env.APP_TIMEZONE, now);
  const { from, to } = buildRange(days, now, offset);
  const inRange = (q, col) => q.where(col, '>=', from).andWhere(col, '<', to);

  const [byReel, heat, intents, replyDelays, aiDelays, campaigns, dmOutcomes] = await Promise.all([
    inRange(db('comments as c'), 'c.created_at')
      .leftJoin('media as m', 'm.ig_media_id', 'c.ig_media_id')
      .select('c.ig_media_id', 'm.caption', 'm.permalink', 'm.thumbnail_url', 'm.media_product_type')
      .count({ comments: '*' })
      .sum({
        matched: db.raw('CASE WHEN c.campaign_id IS NOT NULL THEN 1 ELSE 0 END'),
        replies: db.raw("CASE WHEN c.public_reply_status = 'sent' THEN 1 ELSE 0 END"),
        dms: db.raw("CASE WHEN c.private_reply_status = 'sent' THEN 1 ELSE 0 END"),
      })
      .groupBy('c.ig_media_id', 'm.caption', 'm.permalink', 'm.thumbnail_url', 'm.media_product_type')
      .orderBy('comments', 'desc')
      .limit(15),

    inRange(db('comments'), 'created_at')
      .select(
        db.raw("DAYOFWEEK(CONVERT_TZ(created_at, '+00:00', ?)) as dow", [offset]),
        db.raw("HOUR(CONVERT_TZ(created_at, '+00:00', ?)) as hour", [offset]),
      )
      .count('* as n')
      .groupByRaw('dow, hour'),

    inRange(db('messages').whereNotNull('ai_meta').where({ direction: 'outbound' }), 'created_at')
      .select(db.raw("JSON_VALUE(ai_meta, '$.intent') as intent"))
      .count('* as n')
      .groupByRaw('intent')
      .orderBy('n', 'desc'),

    inRange(db('comments').whereNotNull('public_replied_at'), 'created_at')
      .select(db.raw('TIMESTAMPDIFF(SECOND, created_at, public_replied_at) as s'))
      .limit(5000),

    inRange(db('messages as m').where('m.source', 'ai'), 'm.created_at')
      .select(
        db.raw(`TIMESTAMPDIFF(SECOND, (SELECT MAX(i.created_at) FROM messages i
                 WHERE i.contact_id = m.contact_id AND i.direction = 'inbound' AND i.id < m.id), m.created_at) as s`),
      )
      .limit(5000),

    inRange(db('comments as c').join('campaigns as k', 'k.id', 'c.campaign_id'), 'c.created_at')
      .select('k.id', 'k.name', 'k.is_active')
      .count({ matched: '*' })
      .sum({
        replies: db.raw("CASE WHEN c.public_reply_status = 'sent' THEN 1 ELSE 0 END"),
        dms: db.raw("CASE WHEN c.private_reply_status = 'sent' THEN 1 ELSE 0 END"),
        ineligible: db.raw("CASE WHEN c.private_reply_status = 'ineligible' THEN 1 ELSE 0 END"),
        failed: db.raw("CASE WHEN c.status IN ('failed', 'partial') THEN 1 ELSE 0 END"),
        skipped: db.raw("CASE WHEN c.status = 'skipped' THEN 1 ELSE 0 END"),
      })
      .groupBy('k.id', 'k.name', 'k.is_active')
      .orderBy('matched', 'desc'),

    inRange(db('comments').whereIn('private_reply_status', ['sent', 'ineligible', 'failed']), 'created_at')
      .select('private_reply_status as status')
      .count('* as n')
      .groupBy('private_reply_status'),
  ]);

  const dm = Object.fromEntries(dmOutcomes.map((r) => [r.status, Number(r.n)]));
  const dmAttempts = (dm.sent ?? 0) + (dm.ineligible ?? 0) + (dm.failed ?? 0);

  return {
    range: { days, from, to, timeZone: env.APP_TIMEZONE },
    byReel: byReel.map((r) => {
      const comments = Number(r.comments);
      const dms = Number(r.dms ?? 0);
      return {
        igMediaId: r.ig_media_id,
        caption: r.caption,
        permalink: r.permalink,
        thumbnailUrl: r.thumbnail_url,
        isReel: r.media_product_type === 'REELS',
        comments,
        matched: Number(r.matched ?? 0),
        replies: Number(r.replies ?? 0),
        dms,
        conversion: comments ? Math.round((dms / comments) * 100) : 0,
      };
    }),
    heatmap: toHeatmap(heat),
    intents: intents.filter((r) => r.intent).map((r) => ({ intent: r.intent, count: Number(r.n) })),
    responseTimes: {
      publicReplyMedianSeconds: median(replyDelays.map((r) => Number(r.s))),
      aiReplyMedianSeconds: median(aiDelays.map((r) => Number(r.s))),
    },
    dmDelivery: {
      sent: dm.sent ?? 0,
      notAllowed: dm.ineligible ?? 0,
      failed: dm.failed ?? 0,
      rate: dmAttempts ? Math.round(((dm.sent ?? 0) / dmAttempts) * 100) : null,
    },
    campaigns: campaigns.map((r) => {
      const matched = Number(r.matched);
      return {
        id: r.id,
        name: r.name,
        isActive: Boolean(r.is_active),
        matched,
        replies: Number(r.replies ?? 0),
        dms: Number(r.dms ?? 0),
        dmNotAllowed: Number(r.ineligible ?? 0),
        issues: Number(r.failed ?? 0),
        skipped: Number(r.skipped ?? 0),
        dmRate: matched ? Math.round((Number(r.dms ?? 0) / matched) * 100) : 0,
      };
    }),
  };
}
