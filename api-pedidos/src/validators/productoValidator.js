const { z } = require('zod');

const createProductoSchema = z.object({
  nombre: z.string().min(1, { message: 'Nombre es requerido' }),
  descripcion: z.string().optional(),
  precio: z.number({ invalid_type_error: 'Precio debe ser número' }).gt(0, { message: 'Precio debe ser mayor a 0' }),
  stock: z.number().int({ message: 'Stock debe ser entero' }).min(0, { message: 'Stock no puede ser negativo' })
});

module.exports = { createProductoSchema };
