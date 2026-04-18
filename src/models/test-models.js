import pool from '../config/db.js';

class TestModel {
  static async getByIdForUser(testId, userId) {
    const query = `
      SELECT
        t.id,
        t.user_id,
        t.subject_id,
        t.status,
        t.completed_at,
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

  static async getTaskPlanByTest(testId) {
    const query = `
      SELECT task_id, task_number
      FROM test_tasks
      WHERE test_id = $1
      ORDER BY task_number ASC, order_index ASC
    `;

    const { rows } = await pool.query(query, [testId]);
    return rows.map(row => ({
      taskId: Number(row.task_id),
      taskNumber: Number(row.task_number)
    }));
  }

  static async getTaskCountsByTest(testId) {
    const query = `
      SELECT task_number, COUNT(*)::int AS count
      FROM test_tasks
      WHERE test_id = $1
      GROUP BY task_number
      ORDER BY task_number ASC
    `;

    const { rows } = await pool.query(query, [testId]);
    return rows.map(row => ({
      taskNumber: Number(row.task_number),
      count: Number(row.count)
    }));
  }

  static async getReviewByTest(testId) {
    const query = `
      SELECT
        tt.task_id,
        tt.task_number,
        tt.difficulty,
        tt.order_index,
        t.content,
        t.original_tex,
        t.answer_format,
        t.correct_answer,
        latest.user_answer,
        COALESCE(latest.is_correct, false) AS is_correct
      FROM test_tasks tt
      JOIN tasks t ON t.id = tt.task_id
      LEFT JOIN LATERAL (
        SELECT
          ta.user_answer,
          ta.is_correct
        FROM test_answers ta
        WHERE ta.test_id = $1
          AND ta.task_id = tt.task_id
        ORDER BY ta.answered_at DESC, ta.id DESC
        LIMIT 1
      ) latest ON true
      WHERE tt.test_id = $1
      ORDER BY tt.order_index ASC
    `;

    const { rows } = await pool.query(query, [testId]);
    return rows;
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
