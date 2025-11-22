const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { authenticate } = require('../middleware/authMiddleware');

// Todas las rutas de pedidos requieren autenticación
router.use(authenticate);

router.post('/', pedidosController.crearPedido);
router.get('/', pedidosController.obtenerPedidos);
router.get('/:id', pedidosController.obtenerPedido);
router.put('/:id', pedidosController.actualizarPedido);
router.delete('/:id', pedidosController.eliminarPedido);

module.exports = router;
