const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const { publishPedidoConfirmado } = require('../events/producer');

async function crearPedido(data) {
  return await Pedido.create({
    usuarioId: data.usuarioId,
    items: data.items,
    estado: 'PENDIENTE'
  });
}

async function obtenerPedidos(usuarioId = null) {
  const query = usuarioId ? { usuarioId } : {};
  return await Pedido.find(query).populate('items.productoId').sort({ updatedAt: -1 });
}

async function obtenerPedido(id) {
  return await Pedido.findById(id).populate('items.productoId');
}

async function eliminarPedido(id) {
  return await Pedido.findByIdAndDelete(id);
}

async function cambiarEstado(idPedido, nuevoEstado) {
  const pedido = await Pedido.findById(idPedido);
  if (!pedido) {
    throw new Error('Pedido no encontrado');
  }

  const estadosPermitidos = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];
  if (!estadosPermitidos.includes(nuevoEstado)) {
    throw new Error('Estado inválido');
  }

  const estadoAnterior = pedido.estado;
  pedido.estado = nuevoEstado;
  await pedido.save();

  // Publicar evento a RabbitMQ
  const { publishEstadoCambiado } = require('../events/producer');
  try {
    await publishEstadoCambiado(
      pedido._id.toString(),
      estadoAnterior,
      nuevoEstado
    );
  } catch (eventError) {
    console.error('Error publicando evento:', eventError);
  }

  return pedido;
}

async function confirmarPedido(idPedido) {
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    await session.startTransaction();
    useTransaction = true;
  } catch (error) {
    useTransaction = false;
  }

  try {
    const pedido = useTransaction
      ? await Pedido.findById(idPedido).session(session)
      : await Pedido.findById(idPedido);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.estado !== 'PENDIENTE') {
      throw new Error(`El pedido no puede confirmarse porque está en estado ${pedido.estado}`);
    }

    let total = 0;
    const itemsActualizados = [];

    for (const item of pedido.items) {
      const producto = useTransaction
        ? await Producto.findById(item.productoId).session(session)
        : await Producto.findById(item.productoId);
      if (!producto) {
        throw new Error(`Producto no encontrado: ${item.productoId}`);
      }

      if (!producto.disponible) {
        throw new Error(`El producto ${producto.nombre} no está disponible`);
      }

      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`);
      }

      const subtotal = producto.precio * item.cantidad;
      total += subtotal;

      itemsActualizados.push({
        productoId: producto._id,
        cantidad: item.cantidad,
        nombreProducto: producto.nombre,
        precioUnitario: producto.precio,
        subtotal
      });

      producto.stock -= item.cantidad;
      await (useTransaction ? producto.save({ session }) : producto.save());
    }

    pedido.items = itemsActualizados;
    pedido.subtotal = total;
    pedido.total = total;
    pedido.estado = 'CONFIRMADO';
    await (useTransaction ? pedido.save({ session }) : pedido.save());

    if (useTransaction && session) {
      await session.commitTransaction();
    }

    try {
      await publishPedidoConfirmado({
        pedidoId: pedido._id.toString(),
        usuarioId: pedido.usuarioId.toString(),
        total: pedido.total,
        items: itemsActualizados,
        timestamp: new Date().toISOString()
      });
    } catch (eventError) {
      console.error('Error publicando evento:', eventError);
    }

    return pedido;
  } catch (error) {
    if (useTransaction && session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedido,
  eliminarPedido,
  confirmarPedido,
  cambiarEstado
};
