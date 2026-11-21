
import pool from '../config/database.js';

class User {

  static async create({ first_name, last_name, email, password_hash }) {
    const query = `
      INSERT INTO users (
        first_name, last_name, email, password_hash
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, first_name, last_name, email, role, is_active, created_at;
    `;

    const result = await pool.query(query, [
      first_name,
      last_name,
      email.trim().toLowerCase(),
      password_hash
    ]);

    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT id, first_name, last_name, email,
             password_hash, role, is_active, created_at
      FROM users
      WHERE email = $1;
    `;

    const result = await pool.query(query, [
      email.trim().toLowerCase()
    ]);

    return result.rows[0] || null;
  }

  static async findById(id) {
    const query = `
      SELECT id, first_name, last_name, email,
             role, is_active, created_at
      FROM users
      WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  }

  // Actualizar información personal
  static async updateProfile(id, { first_name, last_name, email }) {
    const query = `
      UPDATE users
      SET first_name = $1,
          last_name = $2,
          email = $3
      WHERE id = $4
      RETURNING id, first_name, last_name, email,
                role, is_active, created_at;
    `;

    const result = await pool.query(query, [
      first_name,
      last_name,
      email.trim().toLowerCase(),
      id
    ]);

    return result.rows[0] || null;
  }

  // Obtener contraseña actual para verificarla
  static async findPasswordById(id) {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  // Actualizar contraseña
  static async updatePassword(id, password_hash) {
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, id]
    );
  }

}

export default User;
