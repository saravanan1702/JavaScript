import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/** Builds the Express app. Kept separate from server.js so tests can import it without listening. */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', 1); // behind Nginx: real client IP + secure cookies

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL, // only our dashboard may call the API from a browser
      credentials: true,
    }),
  );
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  // Capture the exact raw bytes of every JSON body. Meta signs the raw payload
  // (X-Hub-Signature-256), so Phase 3 verifies the signature against req.rawBody —
  // re-serialising parsed JSON would break the HMAC.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(cookieParser());

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
