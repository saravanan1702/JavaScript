import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import instagramRoutes from './instagram.routes.js';

// Each phase mounts its routers here:
//   Phase 2: /instagram (OAuth connect, accounts, media)  ✅
//   Phase 3: /webhooks/instagram  (mounted in app.js — needs the raw body)
//   Phase 4: /campaigns, /media
//   Phase 5: /knowledge (business profile, products, FAQs)
//   Phase 6: /dashboard, /settings
//   Phase 7: /inbox, /analytics, /logs
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/instagram', instagramRoutes);

export default router;
