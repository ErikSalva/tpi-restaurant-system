const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createPedidoSchema } = require('../validators/pedidoValidator');
const { objectIdParam } = require('../validators/paramsValidator');

// Todas las rutas de pedidos requieren autenticación
router.use(authenticate);

router.post('/', validate(createPedidoSchema, 'body'), pedidosController.crearPedido);
router.get('/', pedidosController.obtenerPedidos);
router.get('/:id', validate(objectIdParam, 'params'), pedidosController.obtenerPedido);
router.put('/:id', validate(objectIdParam, 'params'), pedidosController.actualizarPedido);
router.delete('/:id', validate(objectIdParam, 'params'), pedidosController.eliminarPedido);

module.exports = router;
