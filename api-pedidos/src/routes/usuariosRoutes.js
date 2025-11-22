const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Crear usuario es público (registro)
router.post('/', usuariosController.crearUsuario);

// Las demás rutas requieren autenticación
router.use(authenticate);

// Solo ADMIN puede listar y gestionar usuarios
router.get('/', authorizeRoles('ADMIN'), usuariosController.obtenerUsuarios);
router.get('/:id', authorizeRoles('ADMIN'), usuariosController.obtenerUsuario);
router.put('/:id', authorizeRoles('ADMIN'), usuariosController.actualizarUsuario);
router.delete('/:id', authorizeRoles('ADMIN'), usuariosController.eliminarUsuario);

module.exports = router;

