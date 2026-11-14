// DM conversations: incoming messages, echoes of our own messages, and AI auto-replies.
//
//   customer DM ─▶ save (contact + message) ─▶ AI allowed? ─▶ job ai_reply (after a short pause,
//                                                              so several quick messages get ONE answer)
//   ai_reply ─▶ re-check rules + Meta's 24h window ─▶ Claude ─▶ send DM ─▶ save
//                                                       └─ needs_human → flag for you (+ pause AI)
//
//   echo (a message sent FROM the shop) ─▶ ours (known message id)? ignore
//                                        └─ otherwise you replied from the Instagram app → save as "manual",
//                                           and (setting) pause the AI for that customer
import { db } from '../db/knex.js';
import { logger } from '../config/logger.js';
import { enqueue } from '../jobs/queue.js';
import { PermanentError } from '../jobs/errors.js';
import * as ig from '../integrations/instagramGraph.js';
import { AiError } from '../integrations/claude.js';
import { getSettings } from './settings.service.js';
import { getAccessToken, handleGraphError } from './instagramAccount.service.js';
import { generateContactReply, isConfigured as aiConfigured } from './ai.service.js';
import { classifyGraphError } from './automation.service.js';
import { logActivity } from './activityLog.service.js';

export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000; // Meta's standard messaging window

export function isWithinMessagingWindow(lastInboundAt, now = Date.now()) {
  return Boolean(lastInboundAt) && now - new Date(lastInboundAt).getTime() < MESSAGING_WINDOW_MS;
}

/** Pure: should the AI answer this message? Returns null if yes, otherwise the reason it won't. */
export function aiBlockReason({ settings, configured, account, contact, message }) {
  if (!settings.ai_chatbot_enabled) return 'ai_disabled';
  if (!configured) return 'ai_not_configured';
  if (!account || account.status !== 'active') return 'account_inactive';
  if (contact.ai_paused) return 'ai_paused_for_contact';
  if (!message.text || !message.text.trim()) return 'no_text';
  return null;
}

function toDate(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return new Date();
  return new Date(n > 1e12 ? n : n * 1000);
}

async function upsertContact(accountId, igsid, patch = {}) {
  const now = new Date();
  await db('contacts')
    .insert({ account_id: accountId, igsid, ...patch })
    .onConflict(['account_id', 'igsid'])
    .merge({ ...patch, updated_at: now });
  return db('contacts').where({ account_id: accountId, igsid }).first();
}

/** Best effort: fill in username/name for contacts who first wrote to us by DM. */
async function enrichProfile(account, contact) {
  if (contact.username) return;
  try {
    const token = await getAccessToken(account.id);
    const p = await ig.graphGet(contact.igsid, token, { fields: 'name,username,profile_pic' });
    await db('contacts').where({ id: contact.id }).update({
      username: p.username ?? null,
      name: p.name ?? null,
      profile_pic_url: p.profile_pic ?? null,
    });
  } catch (err) {
    logger.debug({ err: err.message }, 'Could not fetch DM sender profile');
  }
}

/** Handles one `messaging` item from a webhook. Returns a short outcome string (for logs/tests). */
export async function handleMessagingEvent(account, m) {
  const msg = m.message;
  if (!msg || msg.is_deleted || msg.is_unsupported) return 'ignored';

  const attachments = Array.isArray(msg.attachments) ? msg.attachments.map((a) => ({ type: a.type, url: a.payload?.url ?? null })) : null;
  const sentAt = toDate(m.timestamp);

  // ── Echo: a message sent from the shop's account ──
  if (msg.is_echo) {
    const igsid = String(m.recipient?.id ?? '');
    if (!igsid || !msg.mid) return 'ignored';
    if (await db('messages').where({ ig_message_id: msg.mid }).first('id')) return 'own_echo'; // sent by this app
    const settings = await getSettings();
    const contact = await upsertContact(account.id, igsid, { last_outbound_at: sentAt });
    await db('messages')
      .insert({ contact_id: contact.id, direction: 'outbound', source: 'manual', ig_message_id: msg.mid, text: msg.text ?? null, attachments: attachments ? JSON.stringify(attachments) : null, status: 'sent', created_at: sentAt })
      .onConflict('ig_message_id')
      .ignore();
    const patch = { needs_attention: false, attention_reason: null, unread_count: 0 };
    if (settings.pause_ai_on_manual_reply && !contact.ai_paused) Object.assign(patch, { ai_paused: true, ai_paused_reason: 'manual_reply' });
    await db('contacts').where({ id: contact.id }).update(patch);
    return 'manual_reply';
  }

  // ── Customer message ──
  const igsid = String(m.sender?.id ?? '');
  if (!igsid || igsid === account.ig_user_id || igsid === account.app_scoped_id) return 'ignored';

  const contact = await upsertContact(account.id, igsid, { last_inbound_at: sentAt });
  let messageId;
  try {
    [messageId] = await db('messages').insert({
      contact_id: contact.id,
      direction: 'inbound',
      source: 'customer',
      ig_message_id: msg.mid ?? null,
      text: msg.text ?? null,
      attachments: attachments ? JSON.stringify(attachments) : null,
      status: 'received',
      created_at: sentAt,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return 'duplicate';
    throw err;
  }
  await db('contacts').where({ id: contact.id }).increment('unread_count', 1);
  await enrichProfile(account, contact);

  const settings = await getSettings();
  const block = aiBlockReason({ settings, configured: aiConfigured(), account, contact, message: { text: msg.text } });
  if (block === 'no_text') {
    // Photos (e.g. payment screenshots) need a person.
    await db('contacts').where({ id: contact.id }).update({ needs_attention: true, attention_reason: 'Customer sent a photo/attachment' });
    return 'needs_attention';
  }
  if (block) return `no_ai:${block}`;

  await enqueue('ai_reply', { contactId: contact.id, messageId }, {
    runAt: new Date(Date.now() + (Number(settings.ai_reply_delay_seconds) || 0) * 1000),
    dedupeKey: `ai_reply:${messageId}`,
    maxAttempts: 4,
  });
  return 'ai_queued';
}

/** Job: answer a customer with Claude. */
export async function handleAiReply({ contactId, messageId }) {
  const contact = await db('contacts').where({ id: contactId }).first();
  if (!contact) throw new PermanentError(`Contact ${contactId} not found`);

  // Debounce: if the customer wrote again, the newest message's job answers everything.
  const latest = await db('messages').where({ contact_id: contactId }).orderBy('id', 'desc').first('id', 'direction');
  if (!latest || latest.id !== messageId || latest.direction !== 'inbound') return;

  const [account, settings] = await Promise.all([db('instagram_accounts').where({ id: contact.account_id }).first(), getSettings()]);
  const block = aiBlockReason({ settings, configured: aiConfigured(), account, contact, message: { text: 'x' } });
  if (block) return;
  if (!isWithinMessagingWindow(contact.last_inbound_at)) return; // Meta: no replies outside the window

  let result;
  try {
    result = await generateContactReply(contactId);
  } catch (err) {
    if (err instanceof AiError && err.retryable) throw err; // queue retries with backoff
    await flag(contactId, `AI could not reply: ${err.message}`);
    await logActivity({ level: 'error', scope: 'ai', message: `AI reply failed for contact #${contactId}: ${err.message}` });
    return;
  }
  if (!result) return;

  // Re-check right before sending: you may have replied or paused the AI while Claude was thinking.
  const fresh = await db('contacts').where({ id: contactId }).first('ai_paused');
  const newest = await db('messages').where({ contact_id: contactId }).orderBy('id', 'desc').first('id');
  if (fresh.ai_paused || newest.id !== messageId) return;

  try {
    const token = await getAccessToken(account.id);
    const { messageId: mid } = await ig.sendDirectMessage(token, contact.igsid, result.reply);
    await db('messages').insert({
      contact_id: contactId,
      direction: 'outbound',
      source: 'ai',
      ig_message_id: mid,
      text: result.reply,
      status: 'sent',
      ai_meta: JSON.stringify({ ...result.meta, intent: result.intent, needsHuman: result.needsHuman, handoffReason: result.handoffReason }),
    });
    await db('contacts').where({ id: contactId }).update({ last_outbound_at: new Date(), unread_count: 0 });
  } catch (err) {
    const kind = classifyGraphError(err);
    if (kind.retry) throw err;
    await handleGraphError(account.id, err, `AI DM to contact #${contactId} failed`);
    await flag(contactId, `Could not send the AI reply: ${err.message}`);
    return;
  }

  if (result.needsHuman) {
    await flag(contactId, result.handoffReason || 'AI asked for a team member', settings.pause_ai_on_handoff);
  }
}

async function flag(contactId, reason, pauseAi = false) {
  await db('contacts')
    .where({ id: contactId })
    .update({
      needs_attention: true,
      attention_reason: String(reason).slice(0, 255),
      ...(pauseAi ? { ai_paused: true, ai_paused_reason: 'handoff' } : {}),
    });
}
