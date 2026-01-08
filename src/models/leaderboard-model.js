import pool from '../config/db.js';

class LeaderboardModel {
  static async getTopUsers() {
    const result = await pool.query(
      `SELECT 
                l.total_points,
                u.full_name
             FROM leaderboard l
             JOIN users u ON l.user_id = u.id
             WHERE u.role = 'student'
             ORDER BY l.total_points DESC
             LIMIT 3`
    );
    return result.rows;
  }

  static async getUserData(userId) {
    const result = await pool.query(
      `SELECT 
                l.total_points,
                u.full_name
             FROM leaderboard l
             JOIN users u ON l.user_id = u.id
             WHERE l.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}

export default LeaderboardModel;