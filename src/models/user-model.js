import pool from '../config/db.js';

class UserModel {
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, email, full_name, role, created_at
             FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create({email, passwordHash, fullName, role = 'student'}) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, full_name, role, created_at`,
      [email, passwordHash, fullName, role]
    );
    return result.rows[0];
  }

  static async updateRefreshToken(userId, refreshToken) {
    const result = await pool.query(
      `UPDATE users 
             SET refresh_token = $2
             WHERE id = $1 
             RETURNING id, email`,
      [userId, refreshToken]
    );
    return result.rows[0];
  }

  static async findByRefreshToken(refreshToken) {
    const result = await pool.query(
      `SELECT id, email, full_name, role
             FROM users 
             WHERE refresh_token = $1`,
      [refreshToken]
    );
    return result.rows[0];
  }

  static async removeRefreshToken(userId) {
    await pool.query(
      `UPDATE users 
             SET refresh_token = NULL
             WHERE id = $1`,
      [userId]
    );
  }

  static async emailExists(email) {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
      [email]
    );
    return result.rows[0].exists;
  }

  static async getProfile(id) {
    const result = await pool.query(
      `SELECT
             id,
             email,
             full_name,
             role,
             avatar_url,  
             created_at
         FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async updateAvatar(id, avatarUrl) {
    const result = await pool.query(
      `UPDATE users 
             SET avatar_url = $2  
             WHERE id = $1 
             RETURNING id, email, full_name, avatar_url`,
      [id, avatarUrl]
    );
    return result.rows[0];
  }
}

export default UserModel;