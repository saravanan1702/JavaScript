import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { safeEqual } from '../utils/crypto.js';
import { verifyMetaSignature } from '../utils/webhookSignature.js';
import { ingestPayload } from '../services/webhook.service.js';
import { logActivity } from '../services/activityLog.service.js';

/**
 * GET — Meta's one-time verification when you save the callback URL in the App Dashboard:
 *   ?hub.mode=subscribe&hub.verify_token=<yours>&hub.challenge=<random>
 * We must echo hub.challenge (plain text) only if the verify token matches.
 */
export function verify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    env.META_WEBHOOK_VERIFY_TOKEN &&
    typeof token === 'string' &&
    safeEqual(token, env.META_WEBHOOK_VERIFY_TOKEN) &&
    typeof challenge === 'string' &&
    /^[\w-]{1,200}$/.test(challenge) // only echo something that looks like a challenge — never arbitrary input
  ) {
    logActivity({ scope: 'webhook', message: 'Webhook callback URL verified by Meta' });
    return res.status(200).type('text/plain').send(challenge);
  }
  logActivity({ level: 'warn', scope: 'webhook', message: 'Webhook verification rejected (wrong verify token or mode)' });
  return res.sendStatus(403);
}

/**
 * POST — event notifications. Order matters:
 *   1. verify the HMAC signature on the raw bytes (reject forgeries with 401, store nothing)
 *   2. store + enqueue (deduplicated)
 *   3. answer 200 quickly — Meta retries slow/failed deliveries and may disable the subscription
 */
export async function receive(req, res) {
  const signature = req.get('x-hub-signature-256');
  const valid = verifyMetaSignature(req.rawBody, signature, [env.INSTAGRAM_APP_SECRET, env.META_APP_SECRET]);
  if (!valid) {
    await logActivity({
      level: 'warn',
      scope: 'webhook',
      message: signature ? 'Rejected webhook with an invalid signature' : 'Rejected webhook without a signature',
      context: { ip: req.ip, bytes: req.rawBody?.length ?? 0 },
    });
    return res.sendStatus(401);
  }

  try {
    const result = await ingestPayload(req.body);
    logger.debug(result, 'Webhook ingested');
    return res.sendStatus(200);
  } catch (err) {
    // DB down etc. — a 500 makes Meta retry later, which is what we want.
    logger.error({ err }, 'Failed to store webhook');
    return res.sendStatus(500);
  }
}
