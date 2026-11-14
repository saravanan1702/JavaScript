// Admin-only read APIs for the Comments and Logs pages.
import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { notFound } from '../utils/httpError.js';
import { db } from '../db/knex.js';
import * as webhooks from '../services/webhook.service.js';
import * as comments from '../services/comment.service.js';
import { retryFailedActions } from '../services/automation.service.js';

const router = Router();
// Scoped to these paths so unknown /api URLs still return 404, not 401.
router.use(['/webhook-events', '/comments', '/logs'], requireAdmin);

const paging = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
};
const idParams = z.object({ id: z.coerce.number().int().positive() });

router.get(
  '/webhook-events',
  validate({
    query: z.object({
      ...paging,
      status: z.enum(['received', 'processing', 'processed', 'ignored', 'failed']).optional(),
      field: z.string().max(50).optional(),
    }),
  }),
  async (req, res) => {
    const [list, stats] = await Promise.all([webhooks.listEvents(req.query), webhooks.eventStats()]);
    res.json({ ...list, stats });
  },
);

router.get('/webhook-events/:id', validate({ params: idParams }), async (req, res) => {
  const event = await webhooks.getEvent(req.params.id);
  if (!event) throw notFound('Event not found');
  res.json({ event });
});

router.post('/webhook-events/:id/retry', validate({ params: idParams }), async (req, res) => {
  if (!(await webhooks.retryEvent(req.params.id))) throw notFound('Event not found');
  res.json({ ok: true });
});

router.get(
  '/comments',
  validate({
    query: z.object({
      ...paging,
      status: z.enum(['received', 'no_match', 'skipped', 'matched', 'queued', 'completed', 'partial', 'failed']).optional(),
      igMediaId: z.string().regex(/^\d+$/).max(64).optional(),
      q: z.string().trim().max(100).optional(),
    }),
  }),
  async (req, res) => {
    const [list, stats] = await Promise.all([comments.listComments(req.query), comments.commentStats()]);
    res.json({ ...list, stats });
  },
);

router.post('/comments/:id/retry', validate({ params: idParams }), async (req, res) => {
  const retried = await retryFailedActions(req.params.id);
  if (retried === null) throw notFound('Comment not found');
  res.json({ retried });
});

router.get(
  '/logs',
  validate({
    query: z.object({
      ...paging,
      level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
      scope: z.string().max(50).optional(),
    }),
  }),
  async (req, res) => {
    const q = db('activity_logs');
    if (req.query.level) q.where({ level: req.query.level });
    if (req.query.scope) q.where({ scope: req.query.scope });
    const [{ total }] = await q.clone().count('* as total');
    const rows = await q
      .select('id', 'level', 'scope', 'message', 'context', 'created_at')
      .orderBy('id', 'desc')
      .limit(req.query.pageSize)
      .offset((req.query.page - 1) * req.query.pageSize);
    res.json({
      total: Number(total),
      page: req.query.page,
      pageSize: req.query.pageSize,
      logs: rows.map((r) => ({
        id: r.id,
        level: r.level,
        scope: r.scope,
        message: r.message,
        context: typeof r.context === 'string' ? JSON.parse(r.context) : r.context,
        createdAt: r.created_at,
      })),
    });
  },
);

export default router;
