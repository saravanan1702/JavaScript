import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express 5 forwards rejected promises from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  return res.status(500).json({
    error: 'Internal server error',
    ...(env.isProd ? {} : { message: err.message }),
  });
}
