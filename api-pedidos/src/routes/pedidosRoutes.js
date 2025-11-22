const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createPedidoSchema } = require('../validators/pedidoValidator');
const { objectIdParam } = require('../validators/paramsValidator');

router.use(authenticate);

// Rutas específicas ANTES de las genéricas con :id
router.post(
  '/',
  validate(createPedidoSchema, 'body'),
  authorizeRoles('USER'),
  pedidosController.crearPedido
);

router.get(
  '/',
  authorizeRoles('USER', 'ADMIN'),
  pedidosController.obtenerPedidos
);

router.post(
  '/:id/confirmar',
  validate(objectIdParam, 'params'),
  authorizeRoles('USER'),
  pedidosController.confirmarPedido
);

router.get(
  '/:id',
  validate(objectIdParam, 'params'),
  authorizeRoles('USER', 'ADMIN'),
  pedidosController.obtenerPedido
);

router.put(
  '/:id',
  validate(objectIdParam, 'params'),
  authorizeRoles('USER', 'ADMIN'),
  pedidosController.actualizarPedido
);

router.delete(
  '/:id',
  validate(objectIdParam, 'params'),
  authorizeRoles('ADMIN'),
  pedidosController.eliminarPedido
);

module.exports = router;
