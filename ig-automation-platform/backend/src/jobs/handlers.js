// Job handlers, keyed by job type. Each phase adds its own:
//   Phase 3: process_webhook_event
//   Phase 4: reply_comment, private_reply
//   Phase 5: ai_reply, send_dm
import { db } from '../db/knex.js';
import { handleCommentEvent } from '../services/comment.service.js';
import { logActivity } from '../services/activityLog.service.js';

/** Throw this for errors that retrying can't fix (bad data, unknown type) → no retries. */
export class PermanentError extends Error {}

async function markEvent(id, status, extra = {}) {
  await db('webhook_events')
    .where({ id })
    .update({ status, ...extra, ...(status === 'processed' || status === 'ignored' ? { processed_at: new Date() } : {}) });
}

async function processWebhookEvent({ eventId }) {
  const event = await db('webhook_events').where({ id: eventId }).first();
  if (!event) throw new PermanentError(`Webhook event ${eventId} not found`);
  if (event.status === 'processed' || event.status === 'ignored') return; // already done (idempotent)

  await db('webhook_events').where({ id: eventId }).update({ status: 'processing', attempts: db.raw('attempts + 1') });
  const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

  try {
    const account = payload.entryId ? await db('instagram_accounts').where({ ig_user_id: payload.entryId }).first() : null;

    if (!account) {
      await markEvent(eventId, 'ignored', { error: `No connected account with Instagram ID ${payload.entryId}` });
      return;
    }

    switch (event.field) {
      case 'comments': {
        const result = await handleCommentEvent(account, payload.value, payload.time);
        await markEvent(eventId, 'processed', { error: null, account_id: account.id });
        if (result.status === 'matched') {
          await logActivity({
            scope: 'automation',
            message: `Comment matched campaign #${result.campaign.id} on keyword "${result.keyword}"`,
            context: { commentId: result.commentId, eventId },
          });
        }
        return;
      }
      case 'messages':
        // Stored for history; conversation handling arrives in Phase 5.
        await markEvent(eventId, 'ignored', { error: null, account_id: account.id });
        return;
      default:
        await markEvent(eventId, 'ignored', { error: null, account_id: account.id });
    }
  } catch (err) {
    await db('webhook_events').where({ id: eventId }).update({ status: 'received', error: String(err.message).slice(0, 2000) });
    throw err; // let the queue retry with backoff
  }
}

export const handlers = {
  process_webhook_event: processWebhookEvent,

  /** Called by the worker when a job has exhausted its retries. */
  async onFinalFailure(job, err) {
    if (job.type === 'process_webhook_event' && job.payload?.eventId) {
      await db('webhook_events').where({ id: job.payload.eventId }).update({ status: 'failed', error: String(err.message).slice(0, 2000) });
    }
    await logActivity({
      level: 'error',
      scope: 'worker',
      message: `Job ${job.type} #${job.id} failed after ${job.attempts} attempts: ${err.message}`,
      context: { jobId: job.id, payload: job.payload },
    });
  },
};
