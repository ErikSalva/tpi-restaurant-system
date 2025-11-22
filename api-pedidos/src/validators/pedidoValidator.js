const { z } = require('zod');

const createPedidoItem = z.object({
  productoId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'productoId inválido' }),
  cantidad: z.number().int({ message: 'cantidad debe ser entero' }).min(1, { message: 'cantidad mínima 1' })
});

const createPedidoSchema = z.object({
  items: z.array(createPedidoItem).min(1, { message: 'items es requerido y debe tener al menos 1 item' })
});

module.exports = { createPedidoSchema };
