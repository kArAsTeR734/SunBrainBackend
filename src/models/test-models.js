import pool from '../config/db.js';

class TestModel {
  static async create(userId, subjectId) {
    const res = await pool.query(
      `INSERT INTO tests (user_id, subject_id)
       VALUES ($1,$2)
       RETURNING *`,
      [userId, subjectId]
    );
    return res.rows[0];
  }

  static async addTasks(testId, tasks) {
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];

      await pool.query(
        `INSERT INTO test_tasks
        (test_id, task_id, task_number, difficulty, order_index)
        VALUES ($1,$2,$3,$4,$5)`,
        [testId, t.id, t.task_number, t.difficulty, i]
      );
    }
  }

  static async getTaskById(taskId) {
    const res = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`,
      [taskId]
    );
    return res.rows[0];
  }

  static async finish(testId) {
    await pool.query(
      `UPDATE tests SET completed_at = NOW(), status = 'completed'
       WHERE id = $1`,
      [testId]
    );
  }
}

export default TestModel;