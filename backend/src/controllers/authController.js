
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// =====================================================
// REGISTRO DE USUARIOS
// =====================================================

export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Validar campos obligatorios
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios.'
      });
    }

    // Validar formato básico del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico no es válido.'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres.'
      });
    }

    // Comprobar si el correo ya está registrado
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    // Cifrar contraseña
    const password_hash = await bcrypt.hash(password, 12);

    // Crear usuario
    const newUser = await User.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email,
      password_hash
    });

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada correctamente.',
      user: newUser
    });

  } catch (error) {
    console.error('Error en el registro:', error.message);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar el usuario.'
    });
  }
};

// =====================================================
// INICIO DE SESIÓN
// =====================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'El correo y la contraseña son obligatorios.'
      });
    }

    // Buscar usuario
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.'
      });
    }

    // Comprobar si la cuenta está activa
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta se encuentra desactivada.'
      });
    }

    // Comparar contraseña
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.'
      });
    }

    // Generar token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    // Responder sin exponer el hash
    const { password_hash, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: safeUser
    });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error interno al iniciar sesión.'
    });
  }
};


// =====================================================
// OBTENER PERFIL DEL USUARIO AUTENTICADO
// =====================================================

export const getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }
  
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Esta cuenta se encuentra desactivada.'
        });
      }
  
      return res.status(200).json({
        success: true,
        user
      });
  
    } catch (error) {
      console.error('Error al obtener el perfil:', error.message);
  
      return res.status(500).json({
        success: false,
        message: 'No se pudo obtener el perfil.'
      });
    }
  };
  

// =====================================================
// ACTUALIZAR PERFIL
// =====================================================

export const updateProfile = async (req, res) => {
    try {
      const { first_name, last_name, email } = req.body;
  
      if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios.'
        });
      }
  
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico no es válido.'
        });
      }
  
      const user = await User.updateProfile(req.user.id, {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim()
      });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }
  
      return res.json({
        success: true,
        message: 'Perfil actualizado correctamente.',
        user
      });
  
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Este correo ya pertenece a otra cuenta.'
        });
      }
  
      console.error('Error actualizando perfil:', error.message);
  
      return res.status(500).json({
        success: false,
        message: 'No se pudo actualizar el perfil.'
      });
    }
  };
  
  
  // =====================================================
  // CAMBIAR CONTRASEÑA
  // =====================================================
  
  export const changePassword = async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
  
      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Debes completar ambos campos.'
        });
      }
  
      if (new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 8 caracteres.'
        });
      }
  
      const user = await User.findPasswordById(req.user.id);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }
  
      const passwordMatch = await bcrypt.compare(
        current_password,
        user.password_hash
      );
  
      if (!passwordMatch) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta.'
        });
      }
  
      const password_hash = await bcrypt.hash(new_password, 12);
  
      await User.updatePassword(req.user.id, password_hash);
  
      return res.json({
        success: true,
        message: 'Contraseña actualizada correctamente.'
      });
  
    } catch (error) {
      console.error('Error cambiando contraseña:', error.message);
  
      return res.status(500).json({
        success: false,
        message: 'No se pudo cambiar la contraseña.'
      });
    }
  };
  