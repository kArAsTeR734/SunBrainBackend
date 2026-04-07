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

  static async addUserToLeaderboard(userId){
    const result = await pool.query(
      `
      INSERT INTO leaderboard (
        user_id,
        total_points,
        tasks_solved,
        correct_solutions,
        last_activity_at,
        created_at)
        
        VALUES (
          $1,
          0,
          0,
          0,
          NOW(),
          NOW()
        );
      `,
      [userId]
    )

    return result[0];
  }

  static async getUserData(userId) {
    const result = await pool.query(
      `SELECT 
        u.full_name,
        l.total_points,
        (SELECT count(*) FROM leaderboard WHERE total_points > l.total_points) + 1 as position
     FROM leaderboard l
     JOIN users u ON l.user_id = u.id
     WHERE l.user_id = $1`,
      [userId]
    );

    const userData = result.rows[0];

    return {
      currentUser: {
        fullName: userData?.full_name,
        points: parseInt(userData?.total_points) || 0,
        position: parseInt(userData?.position) || null
      }
    };
  }

  static async getLeaderboard(limit = 20) {

    const query = `
      SELECT
        id,
        name,
        total_points
      FROM users
      ORDER BY total_points DESC
      LIMIT $1
    `;

    const { rows } = await pool.query(query, [limit]);

    return rows;
  }
}

export default LeaderboardModel;