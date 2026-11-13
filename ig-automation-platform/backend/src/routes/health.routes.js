import { Router } from 'express';
import { pingDb } from '../db/knex.js';
import { listAccounts } from '../services/instagramAccount.service.js';
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
    uptimeSeconds: Math.round(process.uptime()),
    version: process.env.npm_package_version ?? '0.1.0',
  });
});

export default router;
