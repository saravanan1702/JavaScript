import { env, integrations } from './config/env.js';
import { logger } from './config/logger.js';
import { db, pingDb } from './db/knex.js';
import { createApp } from './app.js';
import { startTokenRefresher } from './jobs/tokenRefresher.js';

async function main() {
  if (!(await pingDb())) {
    logger.fatal('Cannot connect to MySQL. Check DB_* variables and that MySQL is running.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    if (!integrations.instagramLogin) logger.warn('INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET not set — Instagram connection disabled.');
    if (!integrations.claude) logger.warn('ANTHROPIC_API_KEY not set yet — needed from Phase 5.');
  });

  const stopTokenRefresher = startTokenRefresher();
  // Phase 3/4 starts the background job worker here.

  // Graceful shutdown: PM2/systemd send SIGTERM on restart/deploy.
  // Stop accepting requests, let in-flight ones finish, then close the DB pool.
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down…`);
    stopTokenRefresher();
    server.close(async () => {
      await db.destroy();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled promise rejection'));

main();
