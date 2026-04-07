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

  static async getByTest(testId) {
    const result = await pool.query(
      `SELECT * FROM test_answers WHERE test_id = $1`,
      [testId]
    );

    return result.rows;
  }
}

export default TestAnswerModel;