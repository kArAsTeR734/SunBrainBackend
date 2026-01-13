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

  static async getUserPosition(userId) {
    const result = await pool.query(
        `SELECT
             COUNT(*) + 1 as position
         FROM leaderboard l2
         WHERE l2.total_points > (
             SELECT total_points
             FROM leaderboard
             WHERE user_id = $1
             )`,
        [userId]
    );

    return parseInt(result.rows[0]?.position) || 1;
  }
}

export default LeaderboardModel;