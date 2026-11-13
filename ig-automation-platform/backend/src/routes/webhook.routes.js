import { Router } from 'express';
import { verify, receive } from '../controllers/webhook.controller.js';

// Public endpoints called by Meta's servers. Protected by the verify token (GET)
// and the HMAC signature (POST) instead of admin login.
const router = Router();
router.get('/instagram', verify);
router.post('/instagram', receive);

export default router;
