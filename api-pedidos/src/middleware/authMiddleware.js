const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

/**
 * Middleware de autenticación JWT
 * Verifica que el token sea válido y agrega el usuario al request
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Extraer el token (remover "Bearer ")
    const token = authHeader.substring(7);

    // Verificar y decodificar el token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret-key-change-in-production'
    );

    // Obtener el usuario completo de la base de datos
    const usuario = await Usuario.findById(decoded.userId).select('-passwordHash');
    
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Agregar el usuario al request para uso en los controladores
    req.user = {
      _id: usuario._id,
      email: usuario.email,
      roles: usuario.roles
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Error de autenticación' });
  }
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga uno de los roles requeridos
 * @param {...string} roles - Roles permitidos (ej: 'ADMIN', 'USER')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const tieneRol = req.user.roles.some(rol => roles.includes(rol));
    
    if (!tieneRol) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción',
        required: roles,
        current: req.user.roles
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};

