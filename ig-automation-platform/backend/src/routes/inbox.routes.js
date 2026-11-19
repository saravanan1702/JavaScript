import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as inbox from '../services/inbox.service.js';
import { getAnalytics } from '../services/analytics.service.js';

const router = Router();
router.use(['/inbox', '/analytics'], requireAdmin); // scoped: unknown /api URLs still 404

const idParams = z.object({ id: z.coerce.number().int().positive() });

router.get(
  '/inbox/conversations',
  validate({
    query: z.object({
      filter: z.enum(['all', 'needs_attention', 'ai_paused', 'unread', 'open_window']).default('all'),
      q: z.string().trim().max(100).optional(),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(30),
    }),
  }),
  async (req, res) => res.json(await inbox.listConversations(req.query)),
);

router.get('/inbox/conversations/:id', validate({ params: idParams }), async (req, res) => res.json(await inbox.getConversation(req.params.id)));

router.post(
  '/inbox/conversations/:id/messages',
  validate({ params: idParams, body: z.object({ text: z.string().trim().min(1, 'Write a message first').max(inbox.MANUAL_MAX_CHARS) }) }),
  async (req, res) => res.status(201).json({ message: await inbox.sendManualReply(req.params.id, req.body.text, req.admin.id) }),
);

router.patch(
  '/inbox/conversations/:id',
  validate({
    params: idParams,
    body: z
      .object({ aiPaused: z.boolean(), needsAttention: z.boolean(), notes: z.string().max(2000) })
      .partial()
      .refine((v) => Object.keys(v).length > 0, 'Nothing to update'),
  }),
  async (req, res) => res.json({ contact: await inbox.updateConversation(req.params.id, req.body) }),
);

router.get(
  '/analytics',
  validate({ query: z.object({ days: z.coerce.number().int().refine((d) => [7, 30, 90].includes(d), 'days must be 7, 30 or 90').default(30) }) }),
  async (req, res) => res.json(await getAnalytics({ days: req.query.days })),
);

export default router;
