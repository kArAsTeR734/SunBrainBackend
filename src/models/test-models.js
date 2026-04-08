import pool from '../config/db.js';

class TestModel {
  static async getByIdForUser(testId, userId) {
    const query = `
      SELECT
        t.id,
        t.user_id,
        t.subject_id,
        s.name AS subject_name,
        s.code AS subject_code
      FROM tests t
      JOIN subjects s ON s.id = t.subject_id
      WHERE t.id = $1
        AND t.user_id = $2
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [testId, userId]);
    return rows[0] || null;
  }

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

  static async getTestTaskById(testId, taskId) {
    const query = `
      SELECT
        t.*,
        tt.task_number,
        tt.difficulty AS test_difficulty
      FROM test_tasks tt
      JOIN tasks t ON t.id = tt.task_id
      WHERE tt.test_id = $1
        AND tt.task_id = $2
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [testId, taskId]);
    return rows[0] || null;
  }

  static async getTaskNumbersByTest(testId) {
    const query = `
      SELECT DISTINCT task_number
      FROM test_tasks
      WHERE test_id = $1
      ORDER BY task_number ASC
    `;

    const { rows } = await pool.query(query, [testId]);
    return rows.map(row => Number(row.task_number));
  }

  static async finish(testId, stats = {}) {
    await pool.query(
      `UPDATE tests 
       SET completed_at = NOW(),
           status = 'completed',
           total_questions = COALESCE($2, total_questions),
           correct_answers = COALESCE($3, correct_answers)
       WHERE id = $1`,
      [testId, stats.totalQuestions ?? null, stats.correctAnswers ?? null]
    );
  }
}

export default TestModel;
