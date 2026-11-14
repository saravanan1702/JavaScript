import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as campaigns from '../services/campaign.service.js';

const router = Router();
router.use(requireAdmin);

const idParams = z.object({ id: z.coerce.number().int().positive() });

router.get('/', async (_req, res) => res.json(await campaigns.listCampaigns()));
router.get('/:id', validate({ params: idParams }), async (req, res) => res.json({ campaign: await campaigns.getCampaign(req.params.id) }));
router.post('/', validate({ body: campaigns.campaignSchema }), async (req, res) => res.status(201).json({ campaign: await campaigns.createCampaign(req.body) }));
router.put('/:id', validate({ params: idParams, body: campaigns.campaignSchema }), async (req, res) =>
  res.json({ campaign: await campaigns.updateCampaign(req.params.id, req.body) }));
router.patch('/:id/status', validate({ params: idParams, body: z.object({ isActive: z.boolean() }) }), async (req, res) =>
  res.json({ campaign: await campaigns.setCampaignActive(req.params.id, req.body.isActive) }));
router.delete('/:id', validate({ params: idParams }), async (req, res) => {
  await campaigns.deleteCampaign(req.params.id);
  res.status(204).end();
});

export default router;
