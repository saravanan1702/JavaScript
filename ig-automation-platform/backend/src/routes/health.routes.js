import { Router } from 'express';
import { pingDb } from '../db/knex.js';
import { listAccounts } from '../services/instagramAccount.service.js';
import { db as knex } from '../db/knex.js';
import { getSettings } from '../services/settings.service.js';
import { env } from '../config/env.js';
import { integrations } from '../config/env.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public liveness probe for uptime monitors / load balancers. Reveals nothing sensitive.
router.get('/', async (_req, res) => {
  const dbOk = await pingDb();
  res.status(dbOk ? 200 : 503).json({ status: dbOk ? 'ok' : 'degraded', db: dbOk });
});

// Detailed status for the dashboard (admin only).
router.get('/status', requireAdmin, async (_req, res) => {
  const db = await pingDb();
  const accounts = db ? await listAccounts() : [];
  const active = accounts.find((a) => a.status === 'active');
  res.json({
    db,
    integrations: {
      instagramAppConfigured: integrations.instagramLogin,
      webhooksConfigured: integrations.webhooks,
      claudeConfigured: integrations.claude,
    },
    instagram: active
      ? { connected: true, username: active.username, tokenDaysLeft: active.tokenDaysLeft, missingScopes: active.missingScopes, webhooksSubscribed: active.webhooksSubscribed }
      : { connected: false, needsReconnect: accounts.some((a) => a.status === 'token_expired') },
    ...(db ? await systemDetails() : {}),
    uptimeSeconds: Math.round(process.uptime()),
    version: process.env.npm_package_version ?? '0.1.0',
  });
});

/** Queue health, last activity and AI configuration, for Settings → System status. */
async function systemDetails() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [jobs, failed24h, lastWebhook, lastError, settings] = await Promise.all([
    knex('jobs').whereIn('status', ['pending', 'running']).select('status').count('* as n').groupBy('status'),
    knex('jobs').where('status', 'failed').andWhere('updated_at', '>=', since).count('* as n'),
    knex('webhook_events').max('received_at as at'),
    knex('activity_logs').where({ level: 'error' }).orderBy('id', 'desc').first('message', 'created_at'),
    getSettings(),
  ]);
  const byStatus = Object.fromEntries(jobs.map((j) => [j.status, Number(j.n)]));
  return {
    queue: { pending: byStatus.pending ?? 0, running: byStatus.running ?? 0, failedLast24h: Number(failed24h[0]?.n ?? 0) },
    lastWebhookAt: lastWebhook[0]?.at ?? null,
    lastError: lastError ? { message: lastError.message, at: lastError.created_at } : null,
    ai: { model: env.ANTHROPIC_MODEL, enabled: settings.ai_chatbot_enabled },
    automation: {
      comments: settings.comment_automation_enabled,
      dms: settings.dm_automation_enabled,
    },
    timeZone: env.APP_TIMEZONE,
  };
}

export default router;
