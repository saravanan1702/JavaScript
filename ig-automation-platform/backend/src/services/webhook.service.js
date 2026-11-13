// Webhook intake: turns a verified Meta payload into one webhook_events row per change,
// deduplicated, and queues each for background processing.
import { db } from '../db/knex.js';
import { sha256 } from '../utils/crypto.js';
import { enqueue } from '../jobs/queue.js';

const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Pure function (no DB) — splits a payload into individual events.
 *
 * Instagram payload shapes:
 *   changes:   { object:'instagram', entry:[{ id:<ig account id>, time, changes:[{ field:'comments', value:{ id, text, from:{id,username}, media:{id,media_product_type}, parent_id } }] }] }
 *   messaging: { object:'instagram', entry:[{ id, time, messaging:[{ sender:{id}, recipient:{id}, timestamp, message:{ mid, text, is_echo } }] }] }
 */
export function extractEvents(body) {
  if (!body || body.object !== 'instagram' || !Array.isArray(body.entry)) return [];
  const events = [];

  for (const entry of body.entry) {
    const igAccountId = entry?.id != null ? String(entry.id) : null;

    for (const change of entry?.changes ?? []) {
      const field = String(change?.field ?? 'unknown').slice(0, 50);
      const value = change?.value ?? {};
      let identity;
      let summary;
      if ((field === 'comments' || field === 'live_comments') && value.id) {
        identity = `${field}:${value.id}`;
        summary = `@${value.from?.username ?? 'unknown'}: ${value.text ?? ''}`;
      } else {
        identity = `${field}:${entry.time ?? ''}:${JSON.stringify(value)}`;
        summary = field;
      }
      events.push({ field, igAccountId, identity, summary: clip(summary, 255), payload: { entryId: igAccountId, time: entry.time ?? null, value } });
    }

    for (const m of entry?.messaging ?? []) {
      let field = 'messaging_other';
      let identity = `messaging:${JSON.stringify(m)}`;
      let summary = 'messaging event';
      if (m.message) {
        field = 'messages';
        identity = m.message.mid ? `messages:${m.message.mid}` : identity;
        summary = `${m.message.is_echo ? 'Echo to' : 'DM from'} ${m.message.is_echo ? m.recipient?.id : m.sender?.id}: ${m.message.text ?? '[attachment]'}`;
      } else if (m.postback) {
        field = 'messaging_postbacks';
        summary = `Postback: ${m.postback.title ?? m.postback.payload ?? ''}`;
      } else if (m.reaction) {
        field = 'message_reactions';
        summary = `Reaction ${m.reaction.reaction ?? ''}`;
      } else if (m.read) {
        field = 'messaging_seen';
        summary = 'Message seen';
      }
      events.push({ field, igAccountId, identity, summary: clip(summary, 255), payload: { entryId: igAccountId, time: entry.time ?? null, messaging: m } });
    }
  }
  return events;
}

/** Stores events and queues processing. Duplicates (Meta retries) are counted and dropped. */
export async function ingestPayload(body) {
  const events = extractEvents(body);
  const result = { received: events.length, stored: 0, duplicates: 0 };
  if (!events.length) return result;

  const igIds = [...new Set(events.map((e) => e.igAccountId).filter(Boolean))];
  const accounts = igIds.length ? await db('instagram_accounts').whereIn('ig_user_id', igIds).select('id', 'ig_user_id') : [];
  const accountIdByIg = new Map(accounts.map((a) => [a.ig_user_id, a.id]));

  for (const e of events) {
    try {
      await db.transaction(async (trx) => {
        const [eventId] = await trx('webhook_events').insert({
          dedupe_key: sha256(e.identity),
          object: 'instagram',
          field: e.field,
          account_id: accountIdByIg.get(e.igAccountId) ?? null,
          summary: e.summary,
          payload: JSON.stringify(e.payload),
          status: 'received',
        });
        await enqueue('process_webhook_event', { eventId }, { dedupeKey: `evt:${eventId}`, trx });
      });
      result.stored += 1;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') result.duplicates += 1;
      else throw err;
    }
  }
  return result;
}

// ─────────────── admin queries (Logs page) ───────────────

export async function listEvents({ status, field, page = 1, pageSize = 25 }) {
  const q = db('webhook_events');
  if (status) q.where({ status });
  if (field) q.where({ field });
  const [{ total }] = await q.clone().count('* as total');
  const rows = await q
    .select('id', 'field', 'account_id', 'summary', 'status', 'attempts', 'error', 'received_at', 'processed_at')
    .orderBy('id', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { total: Number(total), page, pageSize, events: rows.map(toPublicEvent) };
}

export async function getEvent(id) {
  const row = await db('webhook_events').where({ id }).first();
  if (!row) return null;
  return { ...toPublicEvent(row), payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload };
}

export async function retryEvent(id) {
  const row = await db('webhook_events').where({ id }).first();
  if (!row) return false;
  await db('webhook_events').where({ id }).update({ status: 'received', error: null });
  // A fresh dedupe key per retry so a previously failed job doesn't block the new one.
  await enqueue('process_webhook_event', { eventId: id }, { dedupeKey: `evt:${id}:retry:${Date.now()}` });
  return true;
}

export async function eventStats() {
  const rows = await db('webhook_events').select('status').count('* as n').groupBy('status');
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
}

function toPublicEvent(r) {
  return {
    id: r.id,
    field: r.field,
    accountId: r.account_id,
    summary: r.summary,
    status: r.status,
    attempts: r.attempts,
    error: r.error,
    receivedAt: r.received_at,
    processedAt: r.processed_at,
  };
}
