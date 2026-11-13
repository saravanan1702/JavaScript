import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { login, logout, me, loginSchema } from '../controllers/auth.controller.js';

const router = Router();

// Brute-force protection: 10 login attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, validate({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', requireAdmin, me);

export default router;
