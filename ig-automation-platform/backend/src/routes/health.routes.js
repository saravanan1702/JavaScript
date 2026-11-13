import { Router } from 'express';
import { pingDb } from '../db/knex.js';
import { integrations } from '../config/env.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public liveness probe for uptime monitors / load balancers. Reveals nothing sensitive.
router.get('/', async (_req, res) => {
  const dbOk = await pingDb();
  res.status(dbOk ? 200 : 503).json({ status: dbOk ? 'ok' : 'degraded', db: dbOk });
});

// Detailed status for the dashboard (admin only). Phase 2+ adds Instagram token status.
router.get('/status', requireAdmin, async (_req, res) => {
  res.json({
    db: await pingDb(),
    integrations: {
      metaAppConfigured: integrations.meta,
      claudeConfigured: integrations.claude,
    },
    uptimeSeconds: Math.round(process.uptime()),
    version: process.env.npm_package_version ?? '0.1.0',
  });
});

export default router;
