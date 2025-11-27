const usuariosService = require('../services/usuariosService');

exports.crearUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.crearUsuario(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerPerfil = async (req, res) => {
  try {
    // req.user viene del middleware authenticate
    const usuario = await usuariosService.obtenerUsuario(req.user.userId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await usuariosService.obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.obtenerUsuario(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.actualizarUsuario(req.params.id, req.body);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.eliminarUsuario(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
