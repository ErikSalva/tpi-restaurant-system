const apm = require('../../apm');

exports.trazarPedido = (pedido) => {
  if (!apm || !pedido) return;

  // Etiquetas simples
  apm.addLabels({
    pedido_id: pedido._id?.toString(),
    pedido_estado: pedido.estado,
    items_count: pedido.items?.length
  });

  // Contexto detallado
  apm.setCustomContext({
    pedido: {
      id: pedido._id?.toString(),
      total: pedido.total,
      estado: pedido.estado,
      items_count: pedido.items.length,
      productos: pedido.items.map(item => ({
        productoId: item.productoId.toString(),
        nombre: item.nombreProducto,
        cantidad: item.cantidad,
        precio: item.precioUnitario,
        subtotal: item.subtotal
      }))
    }
  });
};
