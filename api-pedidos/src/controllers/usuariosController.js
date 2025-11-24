const usuariosService = require('../services/usuariosService');

exports.crearUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.crearUsuario(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body; // En OAuth2 estricto esto sería username y password

    if (!email || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Email y contraseña son requeridos'
      });
    }

    const resultado = await usuariosService.autenticarUsuario(email, password);

    // OAuth2 espera status 200 OK con el json del token
    res.json(resultado);

  } catch (error) {
    // Si falla la contraseña, OAuth2 prefiere 'invalid_grant'
    res.status(401).json({
      error: 'invalid_grant',
      error_description: error.message
    });
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
