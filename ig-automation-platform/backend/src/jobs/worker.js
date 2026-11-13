// Background worker: polls the jobs table and runs handlers with limited concurrency.
// Runs inside the API process (simple to deploy); can be split into its own process later.
import { logger } from '../config/logger.js';
import { claimJobs, completeJob, failJob, releaseStaleJobs, purgeOldJobs } from './queue.js';
import { handlers, PermanentError } from './handlers.js';

const POLL_MS = 1000;
const CONCURRENCY = 4;
const MAINTENANCE_MS = 60_000;

export function startWorker({ pollMs = POLL_MS, concurrency = CONCURRENCY } = {}) {
  let stopped = false;
  let running = 0;
  let lastMaintenance = 0;
  let timer = null;
  const inFlight = new Set();

  async function runJob(job) {
    const handler = handlers[job.type];
    try {
      if (!handler) throw new PermanentError(`No handler for job type "${job.type}"`);
      await handler(job.payload, job);
      await completeJob(job.id);
    } catch (err) {
      const outcome = await failJob(job, err, { retryable: !(err instanceof PermanentError) });
      logger[outcome === 'failed' ? 'error' : 'warn'](
        { jobId: job.id, type: job.type, attempt: job.attempts, err: err.message },
        outcome === 'failed' ? 'Job failed permanently' : 'Job failed, will retry',
      );
      if (outcome === 'failed' && handlers.onFinalFailure) await handlers.onFinalFailure(job, err).catch(() => {});
    }
  }

  async function tick() {
    if (stopped) return;
    try {
      if (Date.now() - lastMaintenance > MAINTENANCE_MS) {
        lastMaintenance = Date.now();
        const released = await releaseStaleJobs();
        if (released) logger.warn({ released }, 'Released stale jobs from a crashed worker');
        await purgeOldJobs();
      }

      const free = concurrency - running;
      if (free > 0) {
        const jobs = await claimJobs(free);
        for (const job of jobs) {
          running += 1;
          const p = runJob(job).finally(() => {
            running -= 1;
            inFlight.delete(p);
          });
          inFlight.add(p);
        }
        // Got a full batch → there may be more waiting; poll again right away.
        if (jobs.length === free) return schedule(0);
      }
    } catch (err) {
      logger.error({ err }, 'Worker poll failed');
    }
    return schedule(pollMs);
  }

  function schedule(ms) {
    if (!stopped) timer = setTimeout(tick, ms);
  }

  schedule(0);
  logger.info({ concurrency }, 'Job worker started');

  /** Stops polling and waits for in-flight jobs to finish (graceful shutdown). */
  return async function stop() {
    stopped = true;
    clearTimeout(timer);
    await Promise.allSettled([...inFlight]);
  };
}
