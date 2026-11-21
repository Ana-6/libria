
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ==========================================
// AUTENTICAR USUARIO MEDIANTE JWT
// ==========================================

export const authenticateToken = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Debes iniciar sesión para acceder.'
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;

  // Verificar el token
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.'
    });
  }

  // Consultar el usuario actualizado en PostgreSQL
  try {
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'El usuario ya no existe.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta se encuentra desactivada.'
      });
    }

    // Utilizar los datos actuales de la base de datos
    req.user = user;

    next();

  } catch (error) {
    console.error('Error al autenticar usuario:', error.message);

    return res.status(500).json({
      success: false,
      message: 'No se pudo verificar la autenticación.'
    });
  }
};

// ==========================================
// AUTORIZAR ROLES
// ==========================================

export const authorizeRoles = (...roles) => {

  return (req, res, next) => {

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción.'
      });
    }

    next();
  };
};
