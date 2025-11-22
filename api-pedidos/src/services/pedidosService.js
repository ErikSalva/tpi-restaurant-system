const Pedido = require('../models/Pedido');

/**
 * Crear pedido PENDIENTE (sin calcular totales aún).
 * El cálculo de precios y stock se hace en la transacción "confirmar pedido".
 */
async function crearPedido(data) {
  return await Pedido.create({
    usuarioId: data.usuarioId,
    items: data.items,
    estado: 'PENDIENTE'
  });
}

async function obtenerPedidos(usuarioId = null) {
  const query = usuarioId ? { usuarioId } : {};
  return await Pedido.find(query).populate('items.productoId');
}

async function obtenerPedido(id) {
  return await Pedido.findById(id).populate('items.productoId');
}

async function actualizarPedido(id, data) {
  return await Pedido.findByIdAndUpdate(id, data, { new: true });
}

async function eliminarPedido(id) {
  return await Pedido.findByIdAndDelete(id);
}

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedido,
  actualizarPedido,
  eliminarPedido
};
