// Caches the account's Reels/posts locally so campaigns (Phase 4) can target a Reel
// and the dashboard can show thumbnails without calling Meta on every page load.
import { db } from '../db/knex.js';
import * as ig from '../integrations/instagramGraph.js';
import { getAccessToken, getAccount, handleGraphError } from './instagramAccount.service.js';
import { logActivity } from './activityLog.service.js';

const MAX_SYNC_ITEMS = 300; // newest 300 posts is plenty for choosing campaign Reels

export async function syncMedia(accountId) {
  const account = await getAccount(accountId);
  const token = await getAccessToken(accountId);

  let cursor;
  let synced = 0;
  try {
    do {
      const page = await ig.listMediaPage(token, { limit: 50, after: cursor });
      if (page.items.length) {
        const now = new Date();
        const rows = page.items.map((m) => ({
          account_id: accountId,
          ig_media_id: m.igMediaId,
          media_type: m.mediaType,
          media_product_type: m.mediaProductType,
          caption: m.caption,
          permalink: m.permalink,
          thumbnail_url: m.thumbnailUrl,
          posted_at: m.postedAt,
          comments_count: m.commentsCount,
          synced_at: now,
        }));
        await db('media').insert(rows).onConflict('ig_media_id').merge();
        synced += rows.length;
      }
      cursor = page.nextCursor;
    } while (cursor && synced < MAX_SYNC_ITEMS);
  } catch (err) {
    await handleGraphError(accountId, err, `Media sync failed for @${account.username}`);
    throw err;
  }

  await db('instagram_accounts').where({ id: accountId }).update({ media_synced_at: new Date(), updated_at: new Date() });
  await logActivity({ scope: 'instagram', message: `Synced ${synced} posts for @${account.username}`, context: { accountId } });
  return { synced };
}

export async function listMedia(accountId, { reelsOnly = false, limit = 60 } = {}) {
  const q = db('media').where({ account_id: accountId }).orderBy('posted_at', 'desc').limit(limit);
  if (reelsOnly) q.andWhere({ media_product_type: 'REELS' });
  const rows = await q;
  return rows.map((m) => ({
    id: m.id,
    igMediaId: m.ig_media_id,
    mediaType: m.media_type,
    mediaProductType: m.media_product_type,
    caption: m.caption,
    permalink: m.permalink,
    thumbnailUrl: m.thumbnail_url,
    postedAt: m.posted_at,
    commentsCount: m.comments_count,
  }));
}
