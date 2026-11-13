import { db } from '../db/knex.js';
import { logger } from '../config/logger.js';

/**
 * Writes an entry to activity_logs (shown in the dashboard's Logs page in Phase 7)
 * and to the process log. Never throws — logging must not break the main flow.
 */
export async function logActivity({ level = 'info', scope, message, context }) {
  logger[level === 'debug' ? 'debug' : level]({ scope, ...(context ? { context } : {}) }, message);
  try {
    await db('activity_logs').insert({
      level,
      scope,
      message: String(message).slice(0, 500),
      context: context ? JSON.stringify(context) : null,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to write activity log');
  }
}
