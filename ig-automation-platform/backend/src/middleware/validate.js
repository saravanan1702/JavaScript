import { badRequest } from '../utils/httpError.js';

/**
 * Validates req.body / req.query / req.params against Zod schemas and replaces
 * them with the parsed (typed, stripped) values.
 *   router.post('/x', validate({ body: schema }), handler)
 */
export function validate(schemas) {
  return (req, _res, next) => {
    for (const part of ['body', 'query', 'params']) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
        return next(badRequest('Validation failed', details));
      }
      // Express 5 makes req.query a getter, so define it rather than assign.
      Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true });
    }
    return next();
  };
}
