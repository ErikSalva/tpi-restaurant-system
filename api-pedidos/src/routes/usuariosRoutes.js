const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const validate = require('../middleware/validateMiddleware');
const { objectIdParam } = require('../validators/paramsValidator');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// CRUD usuarios
router.post('/', authenticate, authorizeRoles('ADMIN'), usuariosController.crearUsuario);
router.get('/', authenticate, usuariosController.obtenerUsuarios);
router.get('/me', authenticate, usuariosController.obtenerPerfil);
router.get('/:id', authenticate, validate(objectIdParam, 'params'), usuariosController.obtenerUsuario);
router.get('/:id', authenticate, validate(objectIdParam, 'params'), usuariosController.obtenerUsuario);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), validate(objectIdParam, 'params'), usuariosController.actualizarUsuario);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), validate(objectIdParam, 'params'), usuariosController.eliminarUsuario);

module.exports = router;
