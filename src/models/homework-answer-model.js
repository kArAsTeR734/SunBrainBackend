import pool from '../../db.js';

export default class HomeworkAnswerModel {

  static async createAnswer({userId, taskId, answer, isCorrect, points}) {

    const query = `
      INSERT INTO homework_answers
      (user_id, task_id, answer, is_correct, points_awarded)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      userId,
      taskId,
      answer,
      isCorrect,
      points
    ]);

    return rows[0];
  }

}