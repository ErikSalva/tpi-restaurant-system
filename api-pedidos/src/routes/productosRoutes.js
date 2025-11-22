const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// GET /productos - Público (cualquiera puede ver productos)
router.get('/', productosController.obtenerProductos);

// GET /productos/:id - Público
router.get('/:id', productosController.obtenerProducto);

// POST /productos - Solo ADMIN
router.post('/', authenticate, authorizeRoles('ADMIN'), productosController.crearProducto);

// PUT /productos/:id - Solo ADMIN
router.put('/:id', authenticate, authorizeRoles('ADMIN'), productosController.actualizarProducto);

// DELETE /productos/:id - Solo ADMIN
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), productosController.eliminarProducto);

module.exports = router;

