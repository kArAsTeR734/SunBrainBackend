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

  static async getByNumber(taskNumber, subjectId) {
    const query = `
    SELECT 
      t.id,
      t.correct_answer,
      t.points,
      t.difficulty,
      t.topic_id,
      tp.number as task_number
    FROM tasks t
    JOIN topics tp ON t.topic_id = tp.id
    JOIN subjects s ON tp.subject_id = s.id
    WHERE tp.number = $1
      AND s.id = $2
  `;

    const { rows } = await pool.query(query, [taskNumber, subjectId]);

    return rows;
  }

}