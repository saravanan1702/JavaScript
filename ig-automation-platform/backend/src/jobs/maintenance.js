// Housekeeping that keeps the database small and limits how long raw data is stored.
//  - activity_logs and webhook_events older than DATA_RETENTION_DAYS are deleted
//    (failed events are kept until they are retried or reach the retention age)
//  - comments, contacts, messages and campaign stats are business records and are kept
import { db } from '../db/knex.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const BATCH = 5000; // delete in batches so big tables never lock for long

async function deleteInBatches(table, applyWhere) {
  let total = 0;
  for (;;) {
    const ids = await applyWhere(db(table)).limit(BATCH).pluck('id');
    if (!ids.length) return total;
    total += await db(table).whereIn('id', ids).del();
    if (ids.length < BATCH) return total;
  }
}

export async function purgeOldData(now = new Date()) {
  const cutoff = new Date(now.getTime() - env.DATA_RETENTION_DAYS * 86_400_000);
  const logs = await deleteInBatches('activity_logs', (q) => q.where('created_at', '<', cutoff));
  const events = await deleteInBatches('webhook_events', (q) => q.where('received_at', '<', cutoff));
  if (logs || events) logger.info({ logs, events, retentionDays: env.DATA_RETENTION_DAYS }, 'Purged old data');
  return { logs, events };
}
