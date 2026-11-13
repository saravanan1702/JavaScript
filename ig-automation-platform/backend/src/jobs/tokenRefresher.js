// Keeps Instagram tokens alive 24/7. Long-lived tokens last ≈60 days; we refresh any
// token with ≤ 20 days left (and ≥ 24h old, per Meta's rule). Runs shortly after startup
// and then every 6 hours, so even a server that was off for weeks catches up on boot.
import { logger } from '../config/logger.js';
import { refreshExpiringTokens } from '../services/instagramAccount.service.js';

const INTERVAL_MS = 6 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 60 * 1000;

async function run() {
  try {
    const { refreshed, failed } = await refreshExpiringTokens();
    if (refreshed || failed) logger.info({ refreshed, failed }, 'Token refresh run finished');
  } catch (err) {
    logger.error({ err }, 'Token refresh run crashed');
  }
}

export function startTokenRefresher() {
  const first = setTimeout(run, STARTUP_DELAY_MS);
  const timer = setInterval(run, INTERVAL_MS);
  first.unref();
  timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
