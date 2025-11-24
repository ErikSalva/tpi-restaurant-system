const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Crear un nuevo usuario
 */
async function crearUsuario(data) {
  // Verificar si el email ya existe
  const usuarioExistente = await Usuario.findOne({ email: data.email });
  if (usuarioExistente) {
    throw new Error('El email ya está registrado');
  }

  // Hashear la contraseña
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Crear el usuario
  const usuario = await Usuario.create({
    email: data.email,
    passwordHash: passwordHash,
    roles: data.roles || ['USER']
  });

  // No devolver el passwordHash en la respuesta
  const usuarioResponse = usuario.toObject();
  delete usuarioResponse.passwordHash;
  return usuarioResponse;
}

/**
 * Obtener todos los usuarios
 */
async function obtenerUsuarios() {
  const usuarios = await Usuario.find().select('-passwordHash');
  return usuarios;
}

/**
 * Obtener un usuario por ID
 */
async function obtenerUsuario(id) {
  const usuario = await Usuario.findById(id).select('-passwordHash');
  return usuario;
}

/**
 * Obtener un usuario por email
 */
async function obtenerUsuarioPorEmail(email) {
  const usuario = await Usuario.findOne({ email: email.toLowerCase() });
  return usuario;
}

/**
 * Actualizar un usuario
 */
async function actualizarUsuario(id, data) {
  const updateData = { ...data };

  // Si se actualiza la contraseña, hashearla
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
    delete updateData.password;
  }

  const usuario = await Usuario.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');
  return usuario;
}

/**
 * Eliminar un usuario
 */
async function eliminarUsuario(id) {
  return await Usuario.findByIdAndDelete(id);
}

/**
 * Autenticar usuario (login)
 */
async function autenticarUsuario(email, password) {
  const usuario = await obtenerUsuarioPorEmail(email);

  if (!usuario) {
    throw new Error('Credenciales inválidas'); // En OAuth2 estricto sería 'invalid_grant'
  }

  const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

  if (!passwordValido) {
    throw new Error('Credenciales inválidas');
  }

  // Mapeamos ROLES a SCOPES (OAuth2 usa scopes)
  const scopes = usuario.roles.includes('ADMIN') ? 'read write delete' : 'read write';

  // Configuración de expiración
  const expiresInSeconds = 86400; // 24 horas

  // Generar token JWT
  const token = jwt.sign(
    {
      userId: usuario._id,
      email: usuario.email,
      roles: usuario.roles,
      scope: scopes 
    },
    process.env.JWT_SECRET || 'secret-key-change-in-production',
    { expiresIn: expiresInSeconds }
  );

  return {
    access_token: token,
    token_type: 'Bearer',
    expires_in: expiresInSeconds,
    scope: scopes,
    usuario_info: {
      email: usuario.email,
      roles: usuario.roles
    }
  };
}

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuario,
  obtenerUsuarioPorEmail,
  actualizarUsuario,
  eliminarUsuario,
  autenticarUsuario
};

