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
    throw new Error('Credenciales inválidas');
  }

  const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
  
  if (!passwordValido) {
    throw new Error('Credenciales inválidas');
  }

  // Generar token JWT
  const token = jwt.sign(
    { 
      userId: usuario._id, 
      email: usuario.email, 
      roles: usuario.roles 
    },
    process.env.JWT_SECRET || 'secret-key-change-in-production',
    { expiresIn: '24h' }
  );

  // Devolver usuario sin passwordHash
  const usuarioResponse = usuario.toObject();
  delete usuarioResponse.passwordHash;

  return {
    token,
    usuario: usuarioResponse
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

