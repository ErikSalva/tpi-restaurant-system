const { ZodError } = require('zod');

/**
 * validate(schema, target)
 * - schema: a Zod schema
 * - target: 'body' | 'params' | 'query' (defaults to 'body')
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    try {
      const data = req[target];

      // Helpful debug log when body is empty
      if (target === 'body' && (data === undefined || (typeof data === 'object' && Object.keys(data).length === 0))) {
        console.warn('validateMiddleware: request body is empty or undefined');
      }

      const result = schema.parse(data);
      // replace with parsed (coerced) data
      req[target] = result;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Build detailed messages with path context
        const details = err.errors.map(e => {
          const path = Array.isArray(e.path) && e.path.length ? e.path.join('.') : target;
          const msg = e.message || 'Invalid';
          return `${path}: ${msg}`;
        });
        const message = details.join('; ');
        return res.status(400).json({ message });
      }
      next(err);
    }
  };
}

module.exports = validate;
