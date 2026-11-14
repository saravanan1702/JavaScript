import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import instagramRoutes from './instagram.routes.js';
import webhookRoutes from './webhook.routes.js';
import adminRoutes from './admin.routes.js';
import campaignRoutes from './campaign.routes.js';
import knowledgeRoutes from './knowledge.routes.js';

// Each phase mounts its routers here:
//   Phase 2: /instagram (OAuth connect, accounts, media)  ✅
//   Phase 3: /webhooks/instagram (public, signature-checked), /webhook-events, /comments, /logs  ✅
//   Phase 4: /campaigns, /comments/:id/retry  ✅
//   Phase 5: /knowledge, /settings, /ai  ✅
//   Phase 6: /dashboard, /settings
//   Phase 7: /inbox, /analytics
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/instagram', instagramRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/', knowledgeRoutes); // /knowledge, /settings, /ai (admin only)
router.use('/', adminRoutes); // /webhook-events, /comments, /logs (admin only)

export default router;
