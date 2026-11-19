// Fills the database with ~30 days of realistic DEMO activity so you can see the dashboard
// before real customers arrive. Every demo row is tagged (IDs start with "demo_") and can be
// removed again without touching real data.
//
//   npm run demo:seed     # add demo data (refuses to run when NODE_ENV=production)
//   npm run demo:clear    # remove all demo data
import crypto from 'node:crypto';
import { env } from '../src/config/env.js';
import { db } from '../src/db/knex.js';

const clear = process.argv.includes('--clear');
const DAY = 86_400_000;
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function removeDemo() {
  const contacts = db('contacts').where('igsid', 'like', 'demo_%').select('id');
  await db('messages').whereIn('contact_id', contacts).del();
  await db('contacts').where('igsid', 'like', 'demo_%').del();
  await db('comments').where('ig_comment_id', 'like', 'demo_%').del();
  await db('webhook_events').where('summary', 'like', '[demo]%').del();
  const camps = await db('campaigns').where('name', 'like', '[Demo]%').select('id');
  await db('campaigns').whereIn('id', camps.map((c) => c.id)).del();
}

async function seed() {
  const account = await db('instagram_accounts').whereNot({ status: 'disconnected' }).first();
  if (!account) throw new Error('Connect (or create) an Instagram account first');

  const campaignDefs = [
    { name: '[Demo] Gold bracelet', keywords: ['price', 'cost'], weight: 5 },
    { name: '[Demo] Festive earrings', keywords: ['link', 'details'], weight: 3 },
    { name: '[Demo] Catalogue', keywords: ['catalogue', 'order'], weight: 2 },
  ];
  const campaigns = [];
  for (const def of campaignDefs) {
    const [id] = await db('campaigns').insert({
      account_id: account.id, name: def.name, applies_to_all_media: true,
      public_replies: JSON.stringify(['Thank you {{username}}! Check your DM ❤️']), send_dm: true, dm_message: 'Hi {{username}}!', is_active: true,
    });
    for (const k of def.keywords) await db('campaign_keywords').insert({ campaign_id: id, keyword: k });
    campaigns.push({ id, ...def });
  }
  const weighted = campaigns.flatMap((c) => Array(c.weight).fill(c));
  const names = ['priya', 'kavya', 'anu', 'meena', 'divya', 'lakshmi', 'swathi', 'nisha', 'ramya', 'deepa', 'harini', 'sneha'];
  const now = Date.now();
  let comments = 0;
  let dms = 0;

  for (let d = 29; d >= 0; d -= 1) {
    const growth = 1 + (29 - d) / 20; // activity grows over the month
    const count = Math.round(rand(6, 14) * growth * (d % 7 === 0 || d % 7 === 1 ? 1.4 : 1)); // weekend bump
    for (let i = 0; i < count; i += 1) {
      const at = new Date(now - d * DAY - rand(0, 20 * 3600) * 1000);
      if (at > new Date()) continue;
      const user = `${pick(names)}${rand(1, 999)}`;
      const matchedRoll = Math.random();
      const campaign = matchedRoll < 0.62 ? pick(weighted) : null;
      const outcome = !campaign ? null : pick(['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'partial', 'skipped', 'failed']);
      const sent = outcome === 'completed' || outcome === 'partial';
      const [commentId] = await db('comments').insert({
        account_id: account.id,
        ig_comment_id: `demo_${crypto.randomBytes(6).toString('hex')}`,
        ig_media_id: 'demo_media',
        commenter_ig_id: `demo_u_${user}`,
        commenter_username: user,
        text: campaign ? `${pick(campaign.keywords)}?` : pick(['So pretty 😍', 'Love this!', '🔥🔥', 'Beautiful work']),
        commented_at: at,
        created_at: at,
        campaign_id: campaign?.id ?? null,
        matched_keyword: campaign ? campaign.keywords[0] : null,
        status: campaign ? outcome : 'no_match',
        skip_reason: outcome === 'skipped' ? 'duplicate_commenter' : null,
        public_reply_status: sent ? 'sent' : outcome === 'failed' ? 'failed' : 'none',
        public_replied_at: sent ? new Date(at.getTime() + 60_000) : null,
        private_reply_status: outcome === 'completed' ? 'sent' : outcome === 'partial' ? 'ineligible' : 'none',
        private_replied_at: outcome === 'completed' ? new Date(at.getTime() + 66_000) : null,
      });
      comments += 1;
      if (outcome === 'completed') {
        const [contactId] = await db('contacts').insert({ account_id: account.id, igsid: `demo_${user}_${commentId}`, username: user, last_outbound_at: at });
        await db('messages').insert({ contact_id: contactId, direction: 'outbound', source: 'private_reply', text: 'Hi! Here are the details ❤️', status: 'sent', comment_id: commentId, created_at: new Date(at.getTime() + 66_000) });
        dms += 1;
        if (Math.random() < 0.45) {
          const replyAt = new Date(at.getTime() + rand(2, 60) * 60_000);
          if (replyAt < new Date()) {
            await db('messages').insert({ contact_id: contactId, direction: 'inbound', source: 'customer', text: pick(['Is COD available?', 'Do you have it in silver?', 'How many days for delivery?']), status: 'received', created_at: replyAt });
            const handoff = Math.random() < 0.15;
            await db('messages').insert({
              contact_id: contactId, direction: 'outbound', source: 'ai', status: 'sent', created_at: new Date(replyAt.getTime() + 10_000),
              text: handoff ? 'Let me check with the team 🙏' : 'Yes! COD is available in Tamil Nadu 😊',
              ai_meta: JSON.stringify({ model: env.ANTHROPIC_MODEL, inputTokens: rand(1100, 1600), outputTokens: rand(40, 120), cacheReadTokens: rand(900, 1100), needsHuman: handoff }),
            });
            await db('contacts').where({ id: contactId }).update({ last_inbound_at: replyAt, needs_attention: handoff, ai_paused: handoff, attention_reason: handoff ? 'Asked about a custom order' : null });
            dms += 1;
          }
        }
      }
    }
    if (Math.random() < 0.15) {
      await db('webhook_events').insert({ dedupe_key: crypto.randomBytes(32).toString('hex'), object: 'instagram', field: 'comments', summary: '[demo] failed delivery', payload: '{}', status: 'failed', error: 'Demo failure', received_at: new Date(now - d * DAY) });
    }
  }
  console.log(`✅ Demo data added: ${comments} comments, ${dms} DMs, ${campaigns.length} campaigns. Remove with: npm run demo:clear`);
}

try {
  if (clear) {
    await removeDemo();
    console.log('✅ Demo data removed.');
  } else {
    if (env.isProd) throw new Error('Refusing to add demo data in production (NODE_ENV=production).');
    await removeDemo();
    await seed();
  }
} catch (err) {
  console.error('❌', err.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
