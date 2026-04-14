import pool from '../config/db.js';

class TestAnswerModel {
  static async create(data) {
    const result = await pool.query(
      `INSERT INTO test_answers 
      (test_id, user_id, task_id, task_number, difficulty, user_answer, is_correct)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        data.testId,
        data.userId,
        data.taskId,
        data.taskNumber,
        data.difficulty,
        data.answer,
        data.isCorrect
      ]
    );

    return result.rows[0];
  }

  static async getLatestByTestAndTask(testId) {
    const query = `
      SELECT DISTINCT ON (task_id)
        id,
        test_id,
        user_id,
        task_id,
        task_number,
        difficulty,
        user_answer,
        is_correct,
        answered_at
      FROM test_answers
      WHERE test_id = $1
      ORDER BY task_id ASC, answered_at DESC, id DESC
    `;

    const result = await pool.query(query, [testId]);
    return result.rows;
  }
}

export default TestAnswerModel;
