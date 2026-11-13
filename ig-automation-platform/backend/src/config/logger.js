import pino from 'pino';
import { env } from './env.js';

// Structured JSON logs in production (ship them to a file / journald),
// human-readable logs in development.
export const logger = pino({
  level: env.isTest ? 'silent' : env.LOG_LEVEL,
  // Never let secrets reach the logs, even by accident.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.access_token',
      '*.accessToken',
      '*.password',
      '*.password_hash',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  ...(env.isProd || env.isTest
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } }),
});
