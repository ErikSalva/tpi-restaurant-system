const pedidosService = require('../services/pedidosService');

/**
 * Crear un nuevo pedido
 */
exports.crearPedido = async (req, res) => {
  try {
    const pedidoData = {
      ...req.body,
      usuarioId: req.user._id
    };

    const pedido = await pedidosService.crearPedido(pedidoData);
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Obtener todos los pedidos
 */
exports.obtenerPedidos = async (req, res) => {
  try {
    const usuarioId = req.user.roles.includes('ADMIN') ? null : req.user._id;
    const pedidos = await pedidosService.obtenerPedidos(usuarioId);
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener un pedido por ID
 */
exports.obtenerPedido = async (req, res) => {
  try {
    const pedido = await pedidosService.obtenerPedido(req.params.id);
    
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

    const esAdmin = req.user.roles.includes('ADMIN');
    const esSuPedido = pedido.usuarioId.toString() === req.user._id.toString();

    if (!esAdmin && !esSuPedido) {
      return res.status(403).json({ error: 'No tienes acceso a este pedido' });
    }

    res.json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Actualizar pedido
 */
exports.actualizarPedido = async (req, res) => {
  try {
    const pedido = await pedidosService.actualizarPedido(req.params.id, req.body);
    res.json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Eliminar un pedido
 */
exports.eliminarPedido = async (req, res) => {
  try {
    await pedidosService.eliminarPedido(req.params.id);
    res.json({ message: 'Pedido eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Transacción: CONFIRMAR PEDIDO
 */
exports.confirmarPedido = async (req, res) => {
  try {
    const pedido = await pedidosService.confirmarPedido(req.params.id);

    res.json({
      message: "Pedido confirmado correctamente",
      pedido
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
