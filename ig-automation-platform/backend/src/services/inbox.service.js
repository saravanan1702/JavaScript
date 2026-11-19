// Customer inbox: conversation list, threads, manual replies, AI pause/resume and notes.
import { db } from '../db/knex.js';
import { badRequest, notFound } from '../utils/httpError.js';
import * as ig from '../integrations/instagramGraph.js';
import { getAccessToken, handleGraphError } from './instagramAccount.service.js';
import { getSettings } from './settings.service.js';
import { classifyGraphError } from './automation.service.js';
import { MESSAGING_WINDOW_MS } from './conversation.service.js';
import { logActivity } from './activityLog.service.js';
import { SKIP_REASONS } from './comment.service.js';

export const MANUAL_MAX_CHARS = 1000;

/** Pure: Meta's 24-hour messaging window for a contact. */
export function windowInfo(lastInboundAt, now = Date.now()) {
  if (!lastInboundAt) return { open: false, closesAt: null, minutesLeft: 0 };
  const closesAt = new Date(new Date(lastInboundAt).getTime() + MESSAGING_WINDOW_MS);
  const minutesLeft = Math.max(0, Math.floor((closesAt.getTime() - now) / 60_000));
  return { open: minutesLeft > 0, closesAt, minutesLeft };
}

const parseJson = (v) => (v == null ? null : typeof v === 'string' ? JSON.parse(v) : v);

function toMessage(m) {
  const meta = parseJson(m.ai_meta);
  return {
    id: m.id,
    direction: m.direction,
    source: m.source,
    text: m.text,
    attachments: parseJson(m.attachments),
    status: m.status,
    error: m.error,
    createdAt: m.created_at,
    ai: meta ? { intent: meta.intent ?? null, needsHuman: Boolean(meta.needsHuman), handoffReason: meta.handoffReason ?? null, model: meta.model ?? null } : null,
    commentId: m.comment_id,
  };
}

function toContact(c) {
  return {
    id: c.id,
    igsid: c.igsid,
    username: c.username,
    name: c.name,
    profilePicUrl: c.profile_pic_url,
    aiPaused: Boolean(c.ai_paused),
    aiPausedReason: c.ai_paused_reason,
    needsAttention: Boolean(c.needs_attention),
    attentionReason: c.attention_reason,
    unread: c.unread_count,
    notes: c.notes ?? '',
    firstSeenAt: c.created_at,
    lastInboundAt: c.last_inbound_at,
    window: windowInfo(c.last_inbound_at),
  };
}

export async function listConversations({ filter = 'all', q, page = 1, pageSize = 30 }) {
  const latest = db('messages').select('contact_id').max('id as last_id').groupBy('contact_id').as('lm');
  const query = db('contacts as c').join(latest, 'lm.contact_id', 'c.id').join('messages as m', 'm.id', 'lm.last_id');
  if (filter === 'needs_attention') query.where('c.needs_attention', true);
  if (filter === 'ai_paused') query.where('c.ai_paused', true);
  if (filter === 'unread') query.where('c.unread_count', '>', 0);
  if (filter === 'open_window') query.where('c.last_inbound_at', '>', new Date(Date.now() - MESSAGING_WINDOW_MS));
  if (q) query.andWhere((w) => w.where('c.username', 'like', `%${q}%`).orWhere('c.name', 'like', `%${q}%`));

  const [{ total }] = await query.clone().count('* as total');
  const rows = await query
    .select('c.*', 'm.text as last_text', 'm.direction as last_direction', 'm.source as last_source', 'm.created_at as last_at', 'm.attachments as last_attachments')
    .orderBy('m.created_at', 'desc')
    .orderBy('m.id', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const counts = await db('contacts')
    .select(
      db.raw('SUM(CASE WHEN needs_attention THEN 1 ELSE 0 END) as needs_attention'),
      db.raw('SUM(CASE WHEN ai_paused THEN 1 ELSE 0 END) as ai_paused'),
      db.raw('SUM(CASE WHEN unread_count > 0 THEN 1 ELSE 0 END) as unread'),
    )
    .first();

  return {
    total: Number(total),
    page,
    pageSize,
    counts: { needsAttention: Number(counts?.needs_attention ?? 0), aiPaused: Number(counts?.ai_paused ?? 0), unread: Number(counts?.unread ?? 0) },
    conversations: rows.map((r) => ({
      ...toContact(r),
      lastMessage: { text: r.last_text ?? (r.last_attachments ? '[attachment]' : ''), direction: r.last_direction, source: r.last_source, at: r.last_at },
    })),
  };
}

async function getContactRow(id) {
  const c = await db('contacts').where({ id }).first();
  if (!c) throw notFound('Conversation not found');
  return c;
}

/** Full thread + customer history. Opening a thread marks it read. */
export async function getConversation(id, { limit = 200 } = {}) {
  const c = await getContactRow(id);
  const messages = (await db('messages').where({ contact_id: id }).orderBy('id', 'desc').limit(limit)).reverse();
  if (c.unread_count) await db('contacts').where({ id }).update({ unread_count: 0 });

  // Comments that started this conversation, plus other comments by the same username.
  const commentIds = messages.map((m) => m.comment_id).filter(Boolean);
  const comments = await db('comments as cm')
    .leftJoin('campaigns as k', 'k.id', 'cm.campaign_id')
    .leftJoin('media as md', 'md.ig_media_id', 'cm.ig_media_id')
    .where((w) => {
      if (commentIds.length) w.whereIn('cm.id', commentIds);
      if (c.username) w.orWhere({ 'cm.commenter_username': c.username, 'cm.account_id': c.account_id });
      if (!commentIds.length && !c.username) w.whereRaw('1 = 0');
    })
    .select('cm.id', 'cm.text', 'cm.status', 'cm.skip_reason', 'cm.matched_keyword', 'cm.created_at', 'cm.public_reply_status', 'cm.private_reply_status',
      'k.name as campaign_name', 'md.permalink', 'md.thumbnail_url', 'md.caption')
    .orderBy('cm.id', 'desc')
    .limit(20);

  return {
    contact: { ...toContact(c), unread: 0 },
    messages: messages.map(toMessage),
    history: {
      comments: comments.map((x) => ({
        id: x.id,
        text: x.text,
        status: x.status,
        skipReason: x.skip_reason ? SKIP_REASONS[x.skip_reason] ?? x.skip_reason : null,
        keyword: x.matched_keyword,
        campaign: x.campaign_name,
        publicReplyStatus: x.public_reply_status,
        privateReplyStatus: x.private_reply_status,
        at: x.created_at,
        media: { permalink: x.permalink, thumbnailUrl: x.thumbnail_url, caption: x.caption },
      })),
      enquiries: messages.filter((m) => m.direction === 'inbound').length,
      aiReplies: messages.filter((m) => m.source === 'ai').length,
    },
  };
}

/** Manual reply from the dashboard. Only allowed inside Meta's 24-hour window. */
export async function sendManualReply(id, text, adminId) {
  const c = await getContactRow(id);
  const message = String(text ?? '').trim();
  if (!message) throw badRequest('Write a message first');
  if (message.length > MANUAL_MAX_CHARS) throw badRequest(`Instagram messages are limited to ${MANUAL_MAX_CHARS} characters`);
  const win = windowInfo(c.last_inbound_at);
  if (!win.open) {
    throw badRequest('Meta only allows replies within 24 hours of the customer’s last message. You can message again after they write to you.');
  }

  const account = await db('instagram_accounts').where({ id: c.account_id }).first();
  if (!account || account.status !== 'active') throw badRequest('Instagram account needs reconnecting (Settings).');

  let mid;
  try {
    ({ messageId: mid } = await ig.sendDirectMessage(await getAccessToken(account.id), c.igsid, message));
  } catch (err) {
    await handleGraphError(account.id, err, `Manual reply to contact #${id} failed`);
    const kind = classifyGraphError(err);
    throw badRequest(kind.retry ? `Instagram is busy right now, please try again in a moment (${err.message})` : `Instagram refused the message: ${err.message}`);
  }

  const settings = await getSettings();
  const [messageId] = await db('messages').insert({ contact_id: id, direction: 'outbound', source: 'manual', ig_message_id: mid, text: message, status: 'sent' });
  await db('contacts').where({ id }).update({
    last_outbound_at: new Date(),
    needs_attention: false,
    attention_reason: null,
    unread_count: 0,
    // A person replied → the AI steps back (same rule as replying from the Instagram app).
    ...(settings.pause_ai_on_manual_reply && !c.ai_paused ? { ai_paused: true, ai_paused_reason: 'manual_reply' } : {}),
  });
  await logActivity({ scope: 'inbox', message: `Manual reply sent to @${c.username ?? c.igsid}`, context: { contactId: id, adminId } });
  return toMessage(await db('messages').where({ id: messageId }).first());
}

export async function updateConversation(id, { aiPaused, needsAttention, notes }) {
  const c = await getContactRow(id);
  const patch = {};
  if (aiPaused !== undefined) Object.assign(patch, { ai_paused: aiPaused, ai_paused_reason: aiPaused ? 'manual' : null });
  if (needsAttention !== undefined) Object.assign(patch, { needs_attention: needsAttention, attention_reason: needsAttention ? c.attention_reason ?? 'Flagged by you' : null });
  if (notes !== undefined) patch.notes = notes || null;
  if (Object.keys(patch).length) await db('contacts').where({ id }).update({ ...patch, updated_at: new Date() });
  if (aiPaused !== undefined) await logActivity({ scope: 'inbox', message: `${aiPaused ? 'Paused' : 'Resumed'} AI for @${c.username ?? c.igsid}` });
  return toContact(await getContactRow(id));
}
