// Sends a correctly SIGNED fake comment webhook to your running backend — exactly what
// Meta would send — so you can test detection without posting real comments.
//
//   npm run webhook:simulate -- "Price?"
//   npm run webhook:simulate -- "link pls" --user=priya --media=<ig_media_id>
//   npm run webhook:simulate -- "Price?" --url=https://your-name.ngrok-free.app
//
// Uses the first connected account and its newest synced Reel unless --media is given.
import crypto from 'node:crypto';
import { env } from '../src/config/env.js';
import { db } from '../src/db/knex.js';
import { signMetaPayload } from '../src/utils/webhookSignature.js';

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const text = args.find((a) => !a.startsWith('--')) ?? 'Price?';
const baseUrl = flag('url') ?? `http://localhost:${env.PORT}`;

try {
  if (!env.INSTAGRAM_APP_SECRET) throw new Error('INSTAGRAM_APP_SECRET is not set in backend/.env');
  const account = await db('instagram_accounts').whereNot({ status: 'disconnected' }).first();
  if (!account) throw new Error('Connect an Instagram account first (Settings → Connect Instagram).');
  const mediaId = flag('media') ?? (await db('media').where({ account_id: account.id }).orderBy('posted_at', 'desc').first())?.ig_media_id ?? '18000000000000000';

  const payload = {
    object: 'instagram',
    entry: [{
      id: account.ig_user_id,
      time: Math.floor(Date.now() / 1000),
      changes: [{
        field: 'comments',
        value: {
          id: `sim_${crypto.randomBytes(6).toString('hex')}`,
          text,
          from: { id: flag('from') ?? `9${crypto.randomInt(1e8, 1e9)}`, username: flag('user') ?? 'test_customer' },
          media: { id: mediaId, media_product_type: 'REELS' },
        },
      }],
    }],
  };
  const raw = JSON.stringify(payload);
  const res = await fetch(`${baseUrl}/api/webhooks/instagram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signMetaPayload(Buffer.from(raw), env.INSTAGRAM_APP_SECRET) },
    body: raw,
  });
  console.log(`→ POST ${baseUrl}/api/webhooks/instagram  "${text}" on media ${mediaId}`);
  console.log(res.ok ? `✅ Accepted (HTTP ${res.status}). Check the Comments page in the dashboard.` : `❌ HTTP ${res.status}`);
  if (!res.ok) process.exitCode = 1;
} catch (err) {
  console.error('❌', err.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
