const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const validate = require('../middleware/validateMiddleware');
const { loginSchema } = require('../validators/authValidator');
const { createProductoSchema } = require('../validators/productoValidator');
const { objectIdParam } = require('../validators/paramsValidator');

// Auth
router.post('/register', validate(loginSchema, 'body'), usuariosController.crearUsuario);
router.post('/login', validate(loginSchema, 'body'), usuariosController.login);

// CRUD usuarios (protegidos con roles más adelante)
router.get('/', usuariosController.obtenerUsuarios);
router.get('/:id', validate(objectIdParam, 'params'), usuariosController.obtenerUsuario);
router.put('/:id', validate(objectIdParam, 'params'), usuariosController.actualizarUsuario);
router.delete('/:id', validate(objectIdParam, 'params'), usuariosController.eliminarUsuario);

module.exports = router;
