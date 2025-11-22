const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Auth
router.post('/register', usuariosController.crearUsuario);
router.post('/login', usuariosController.login);

// CRUD usuarios (protegidos con roles más adelante)
router.get('/', usuariosController.obtenerUsuarios);
router.get('/:id', usuariosController.obtenerUsuario);
router.put('/:id', usuariosController.actualizarUsuario);
router.delete('/:id', usuariosController.eliminarUsuario);

module.exports = router;
