// Durable job queue on MySQL (the `jobs` table) — no Redis needed.
//
// - enqueue(): insert a job; an optional dedupe_key makes enqueueing idempotent.
// - claimJobs(): atomically takes due jobs with SELECT … FOR UPDATE SKIP LOCKED, so several
//   workers (or a restarted one) never run the same job twice.
// - Failures retry with exponential backoff + jitter until max_attempts, then stay 'failed'
//   (visible in the dashboard and retryable by hand).
import os from 'node:os';
import { db } from '../db/knex.js';

export const WORKER_ID = `${os.hostname()}:${process.pid}`;
const STALE_LOCK_MS = 5 * 60 * 1000; // a job "running" this long belongs to a crashed worker

/** @returns {Promise<number|null>} job id, or null if a job with the same dedupe key already exists */
export async function enqueue(type, payload, { runAt = new Date(), maxAttempts = 5, dedupeKey = null, trx = db } = {}) {
  try {
    const [id] = await trx('jobs').insert({
      type,
      payload: JSON.stringify(payload),
      run_at: runAt,
      max_attempts: maxAttempts,
      dedupe_key: dedupeKey,
      status: 'pending',
    });
    return id;
  } catch (err) {
    if (dedupeKey && err.code === 'ER_DUP_ENTRY') return null;
    throw err;
  }
}

export async function claimJobs(limit, workerId = WORKER_ID) {
  return db.transaction(async (trx) => {
    const rows = await trx('jobs')
      .select('id')
      .where('status', 'pending')
      .andWhere('run_at', '<=', new Date())
      .orderBy('run_at', 'asc')
      .limit(limit)
      .forUpdate()
      .skipLocked();
    if (!rows.length) return [];

    const ids = rows.map((r) => r.id);
    await trx('jobs')
      .whereIn('id', ids)
      .update({ status: 'running', locked_at: new Date(), locked_by: workerId, attempts: trx.raw('attempts + 1'), updated_at: new Date() });

    const jobs = await trx('jobs').whereIn('id', ids);
    return jobs.map((j) => ({ ...j, payload: typeof j.payload === 'string' ? JSON.parse(j.payload) : j.payload }));
  });
}

export async function completeJob(id) {
  await db('jobs').where({ id }).update({ status: 'done', locked_at: null, last_error: null, updated_at: new Date() });
}

/**
 * Records a failure. Retries later unless attempts are exhausted or the error is permanent.
 * @returns {Promise<'retry'|'failed'>}
 */
export async function failJob(job, err, { retryable = true } = {}) {
  const message = String(err?.message ?? err).slice(0, 2000);
  if (retryable && job.attempts < job.max_attempts) {
    await db('jobs').where({ id: job.id }).update({
      status: 'pending',
      run_at: new Date(Date.now() + backoffMs(job.attempts, err)),
      locked_at: null,
      locked_by: null,
      last_error: message,
      updated_at: new Date(),
    });
    return 'retry';
  }
  await db('jobs').where({ id: job.id }).update({ status: 'failed', locked_at: null, last_error: message, updated_at: new Date() });
  return 'failed';
}

/** 30s, 2m, 8m, 32m… capped at 1h, ±20% jitter. Rate-limit errors wait at least 5 minutes. */
export function backoffMs(attempt, err) {
  const base = Math.min(30_000 * 4 ** Math.max(0, attempt - 1), 60 * 60 * 1000);
  const withFloor = err?.isRateLimit ? Math.max(base, 5 * 60 * 1000) : base;
  return Math.round(withFloor * (0.8 + Math.random() * 0.4));
}

/** Puts jobs from crashed workers back in the queue. */
export async function releaseStaleJobs() {
  return db('jobs')
    .where('status', 'running')
    .andWhere('locked_at', '<', new Date(Date.now() - STALE_LOCK_MS))
    .update({ status: 'pending', locked_at: null, locked_by: null, updated_at: new Date() });
}

/** Removes finished jobs after 14 days to keep the table small. */
export async function purgeOldJobs() {
  return db('jobs')
    .where('status', 'done')
    .andWhere('updated_at', '<', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
    .del();
}
