const { z } = require('zod');

const objectIdParam = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'id inválido' })
});

module.exports = { objectIdParam };
