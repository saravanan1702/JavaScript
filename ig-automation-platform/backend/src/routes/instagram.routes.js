import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as c from '../controllers/instagram.controller.js';

const router = Router();

// The callback is public (Instagram redirects the browser here), so throttle it.
const callbackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });

router.get('/oauth/callback', callbackLimiter, c.oauthCallback);

// Everything else is admin-only.
router.use(requireAdmin);
router.get('/connect', c.startConnect);
router.get('/accounts', c.list);
router.get('/webhook-info', c.webhookInfo);
router.post('/accounts/:id/subscribe-webhooks', validate({ params: c.schemas.idParams }), c.subscribeWebhooks);
router.post('/accounts/:id/refresh-token', validate({ params: c.schemas.idParams }), c.refreshToken);
router.post('/accounts/:id/sync-media', validate({ params: c.schemas.idParams }), c.syncMedia);
router.get('/accounts/:id/media', validate({ params: c.schemas.idParams, query: c.schemas.mediaQuery }), c.listMedia);
router.delete('/accounts/:id', validate({ params: c.schemas.idParams }), c.disconnect);

export default router;
