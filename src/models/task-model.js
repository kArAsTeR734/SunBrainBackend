import pool from '../config/db.js';

export default class TaskModel {

  static async getTaskById(taskId) {

    const query = `
      SELECT id, correct_answer, points
      FROM tasks
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [taskId]);

    return rows[0];
  }

}