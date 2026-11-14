import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as kb from '../services/knowledge.service.js';
import * as settings from '../services/settings.service.js';
import * as ai from '../services/ai.service.js';
import { badRequest } from '../utils/httpError.js';
import { AiError } from '../integrations/claude.js';
import { env } from '../config/env.js';

const router = Router();
// Scoped so unknown /api URLs still 404 instead of 401.
router.use(['/knowledge', '/settings', '/ai'], requireAdmin);
const idParams = z.object({ id: z.coerce.number().int().positive() });

// ─── knowledge base ───
router.get('/knowledge', async (_req, res) => {
  const { profile, products, faqs } = await kb.loadKnowledge();
  res.json({ profile, products, faqs });
});
router.put('/knowledge/profile', validate({ body: kb.profileSchema }), async (req, res) => res.json({ profile: await kb.updateProfile(req.body) }));

router.post('/knowledge/products', validate({ body: kb.productSchema }), async (req, res) => res.status(201).json({ product: await kb.createProduct(req.body) }));
router.put('/knowledge/products/:id', validate({ params: idParams, body: kb.productSchema }), async (req, res) => res.json({ product: await kb.updateProduct(req.params.id, req.body) }));
router.delete('/knowledge/products/:id', validate({ params: idParams }), async (req, res) => {
  await kb.deleteProduct(req.params.id);
  res.status(204).end();
});

router.post('/knowledge/faqs', validate({ body: kb.faqSchema }), async (req, res) => res.status(201).json({ faq: await kb.createFaq(req.body) }));
router.put('/knowledge/faqs/:id', validate({ params: idParams, body: kb.faqSchema }), async (req, res) => res.json({ faq: await kb.updateFaq(req.params.id, req.body) }));
router.delete('/knowledge/faqs/:id', validate({ params: idParams }), async (req, res) => {
  await kb.deleteFaq(req.params.id);
  res.status(204).end();
});

/** Exactly what the AI sees (so the owner can check it). */
router.get('/knowledge/preview', async (_req, res) => res.json({ text: kb.renderKnowledge(await kb.loadKnowledge()) }));

// ─── settings ───
router.get('/settings', async (_req, res) => res.json({ settings: await settings.getSettings() }));
router.patch('/settings', validate({ body: settings.settingsPatchSchema }), async (req, res) => res.json({ settings: await settings.updateSettings(req.body) }));

// ─── AI ───
router.get('/ai/status', async (_req, res) => {
  const s = await settings.getSettings();
  res.json({ configured: ai.isConfigured(), enabled: s.ai_chatbot_enabled, model: env.ANTHROPIC_MODEL, effort: s.ai_effort });
});

const testSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['customer', 'shop']), text: z.string().trim().min(1).max(1000) }))
    .min(1)
    .max(30)
    .refine((m) => m[m.length - 1].role === 'customer', { message: 'The last message must be from the customer' }),
  campaignId: z.coerce.number().int().positive().optional(),
});
router.post('/ai/test', validate({ body: testSchema }), async (req, res) => {
  if (!ai.isConfigured()) throw badRequest('Add ANTHROPIC_API_KEY to backend/.env and restart the backend to use the AI.');
  try {
    res.json({ result: await ai.testConversation(req.body) });
  } catch (err) {
    if (err instanceof AiError) throw badRequest(err.message);
    throw err;
  }
});

export default router;
