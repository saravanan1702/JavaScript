// Campaign management: CRUD, validation, statistics and keyword-overlap warnings.
import { z } from 'zod';
import { db } from '../db/knex.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { normalizeKeyword } from '../utils/keywordMatcher.js';
import { logActivity } from './activityLog.service.js';

// Instagram limits: DM text ≤ 1000 chars. Comment replies can be longer, but short replies read better.
export const LIMITS = { name: 150, keywords: 30, keyword: 100, replies: 10, reply: 500, dm: 1000, productInfo: 5000, media: 50 };

export const campaignSchema = z
  .object({
    name: z.string().trim().min(1, 'Give the campaign a name').max(LIMITS.name),
    accountId: z.coerce.number().int().positive().optional(),
    matchMode: z.enum(['contains', 'exact']).default('contains'),
    appliesToAllMedia: z.boolean().default(false),
    mediaIds: z.array(z.string().trim().min(1).max(64)).max(LIMITS.media).default([]),
    keywords: z
      .array(z.string().max(LIMITS.keyword))
      .transform((list) => [...new Set(list.map(normalizeKeyword).filter(Boolean))])
      .pipe(z.array(z.string()).min(1, 'Add at least one keyword').max(LIMITS.keywords, `At most ${LIMITS.keywords} keywords`)),
    publicReplies: z
      .array(z.string().trim().max(LIMITS.reply, `Replies must be under ${LIMITS.reply} characters`))
      .transform((list) => list.filter(Boolean))
      .pipe(z.array(z.string()).max(LIMITS.replies, `At most ${LIMITS.replies} reply variants`))
      .default([]),
    sendDm: z.boolean().default(true),
    dmMessage: z.string().trim().max(LIMITS.dm, `Instagram DMs are limited to ${LIMITS.dm} characters`).default(''),
    useAiForDm: z.boolean().default(false),
    productId: z.coerce.number().int().positive().nullable().optional(),
    productInfo: z.string().trim().max(LIMITS.productInfo).default(''),
    priority: z.coerce.number().int().min(-100).max(100).default(0),
    isActive: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (!v.appliesToAllMedia && v.mediaIds.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['mediaIds'], message: 'Pick at least one Reel, or choose "All Reels"' });
    }
    if (v.sendDm && !v.dmMessage) {
      ctx.addIssue({ code: 'custom', path: ['dmMessage'], message: 'Write the DM message, or turn off the automatic DM' });
    }
    if (!v.publicReplies.length && !v.sendDm) {
      ctx.addIssue({ code: 'custom', path: ['publicReplies'], message: 'The campaign needs a public reply, a DM, or both' });
    }
  });

async function resolveAccountId(accountId) {
  if (accountId) {
    if (!(await db('instagram_accounts').where({ id: accountId }).first('id'))) throw badRequest('Unknown Instagram account');
    return accountId;
  }
  const acc = await db('instagram_accounts').whereNot({ status: 'disconnected' }).orderBy('id').first('id');
  if (!acc) throw badRequest('Connect an Instagram account first (Settings → Connect Instagram)');
  return acc.id;
}

function toRow(input, accountId) {
  return {
    account_id: accountId,
    name: input.name,
    match_mode: input.matchMode,
    applies_to_all_media: input.appliesToAllMedia,
    public_replies: JSON.stringify(input.publicReplies),
    send_dm: input.sendDm,
    dm_message: input.dmMessage || null,
    use_ai_for_dm: input.useAiForDm,
    product_id: input.productId ?? null,
    product_info: input.productInfo || null,
    priority: input.priority,
    is_active: input.isActive,
  };
}

async function writeChildren(trx, campaignId, input) {
  await trx('campaign_keywords').where({ campaign_id: campaignId }).del();
  await trx('campaign_keywords').insert(input.keywords.map((keyword) => ({ campaign_id: campaignId, keyword })));
  await trx('campaign_media').where({ campaign_id: campaignId }).del();
  const media = input.appliesToAllMedia ? [] : [...new Set(input.mediaIds)];
  if (media.length) await trx('campaign_media').insert(media.map((id) => ({ campaign_id: campaignId, ig_media_id: id })));
}

export async function createCampaign(input) {
  const accountId = await resolveAccountId(input.accountId);
  const id = await db.transaction(async (trx) => {
    const [newId] = await trx('campaigns').insert(toRow(input, accountId));
    await writeChildren(trx, newId, input);
    return newId;
  });
  await logActivity({ scope: 'campaign', message: `Created campaign "${input.name}"`, context: { campaignId: id } });
  return getCampaign(id);
}

export async function updateCampaign(id, input) {
  const existing = await db('campaigns').where({ id }).first();
  if (!existing) throw notFound('Campaign not found');
  const accountId = await resolveAccountId(input.accountId ?? existing.account_id);
  await db.transaction(async (trx) => {
    await trx('campaigns').where({ id }).update({ ...toRow(input, accountId), updated_at: new Date() });
    await writeChildren(trx, id, input);
  });
  await logActivity({ scope: 'campaign', message: `Updated campaign "${input.name}"`, context: { campaignId: id } });
  return getCampaign(id);
}

export async function setCampaignActive(id, isActive) {
  const n = await db('campaigns').where({ id }).update({ is_active: isActive, updated_at: new Date() });
  if (!n) throw notFound('Campaign not found');
  await logActivity({ scope: 'campaign', message: `${isActive ? 'Resumed' : 'Paused'} campaign #${id}` });
  return getCampaign(id);
}

export async function deleteCampaign(id) {
  const c = await db('campaigns').where({ id }).first('name');
  if (!c) throw notFound('Campaign not found');
  // Pending replies for this campaign are cancelled by the pre-flight check (campaign gone → skipped).
  await db('campaigns').where({ id }).del();
  await logActivity({ scope: 'campaign', message: `Deleted campaign "${c.name}"`, context: { campaignId: id } });
}

export async function getCampaign(id) {
  const row = await db('campaigns').where({ id }).first();
  if (!row) throw notFound('Campaign not found');
  const [list] = await hydrate([row]);
  return list;
}

export async function listCampaigns() {
  const rows = await db('campaigns').orderBy([{ column: 'is_active', order: 'desc' }, { column: 'priority', order: 'desc' }, { column: 'id', order: 'desc' }]);
  const campaigns = await hydrate(rows);
  return { campaigns, warnings: overlapWarnings(campaigns) };
}

async function hydrate(rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [keywords, media, stats] = await Promise.all([
    db('campaign_keywords').whereIn('campaign_id', ids),
    db('campaign_media as cm').leftJoin('media as m', 'm.ig_media_id', 'cm.ig_media_id').whereIn('cm.campaign_id', ids)
      .select('cm.campaign_id', 'cm.ig_media_id', 'm.thumbnail_url', 'm.caption', 'm.permalink'),
    db('comments')
      .whereIn('campaign_id', ids)
      .select('campaign_id')
      .count({ matched: '*' })
      .sum({
        replies: db.raw("CASE WHEN public_reply_status = 'sent' THEN 1 ELSE 0 END"),
        dms: db.raw("CASE WHEN private_reply_status = 'sent' THEN 1 ELSE 0 END"),
        failed: db.raw("CASE WHEN status IN ('failed','partial') THEN 1 ELSE 0 END"),
        skipped: db.raw("CASE WHEN status = 'skipped' THEN 1 ELSE 0 END"),
        ineligible: db.raw("CASE WHEN private_reply_status = 'ineligible' THEN 1 ELSE 0 END"),
      })
      .max({ lastMatchedAt: 'created_at' })
      .groupBy('campaign_id'),
  ]);

  return rows.map((r) => {
    const s = stats.find((x) => x.campaign_id === r.id) ?? {};
    return {
      id: r.id,
      accountId: r.account_id,
      name: r.name,
      matchMode: r.match_mode,
      appliesToAllMedia: Boolean(r.applies_to_all_media),
      media: media.filter((m) => m.campaign_id === r.id).map((m) => ({ igMediaId: m.ig_media_id, thumbnailUrl: m.thumbnail_url, caption: m.caption, permalink: m.permalink })),
      mediaIds: media.filter((m) => m.campaign_id === r.id).map((m) => m.ig_media_id),
      keywords: keywords.filter((k) => k.campaign_id === r.id).map((k) => k.keyword),
      publicReplies: typeof r.public_replies === 'string' ? JSON.parse(r.public_replies) : r.public_replies ?? [],
      sendDm: Boolean(r.send_dm),
      dmMessage: r.dm_message ?? '',
      useAiForDm: Boolean(r.use_ai_for_dm),
      productId: r.product_id,
      productInfo: r.product_info ?? '',
      priority: r.priority,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      stats: {
        matched: Number(s.matched ?? 0),
        replies: Number(s.replies ?? 0),
        dms: Number(s.dms ?? 0),
        failed: Number(s.failed ?? 0),
        skipped: Number(s.skipped ?? 0),
        dmIneligible: Number(s.ineligible ?? 0),
        lastMatchedAt: s.lastMatchedAt ?? null,
      },
    };
  });
}

/** Warns when two ACTIVE campaigns share a keyword on the same Reel (the higher priority wins). */
export function overlapWarnings(campaigns) {
  const active = campaigns.filter((c) => c.isActive);
  const warnings = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];
      if (a.accountId !== b.accountId) continue;
      const shared = a.keywords.filter((k) => b.keywords.includes(k));
      const reelsOverlap = a.appliesToAllMedia || b.appliesToAllMedia || a.mediaIds.some((m) => b.mediaIds.includes(m));
      if (shared.length && reelsOverlap) {
        const winner = a.priority === b.priority ? null : a.priority > b.priority ? a : b;
        warnings.push({
          campaignIds: [a.id, b.id],
          keywords: shared,
          message: `"${a.name}" and "${b.name}" both react to ${shared.map((k) => `"${k}"`).join(', ')} on the same Reel. ${
            winner ? `"${winner.name}" wins (higher priority).` : 'Give one a higher priority to control which replies.'
          }`,
        });
      }
    }
  }
  return warnings;
}
