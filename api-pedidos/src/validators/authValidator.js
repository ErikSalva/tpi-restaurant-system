const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'Password es requerido' })
});

module.exports = {
  loginSchema
};
