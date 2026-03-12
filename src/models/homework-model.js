import pool from '../config/db.js';

export default class HomeworkModel {

  static async getUserHomeworks(userId) {

    const query = `
    SELECT 
    h.id,
    h.title,
    s.name AS subject,
    h.deadline,
    COUNT(ht.task_id) AS tasks_count
    FROM homeworks h
    JOIN subjects s ON s.id = h.subject_id
    JOIN homework_assignments ha ON h.id = ha.homework_id
    LEFT JOIN homework_tasks ht ON h.id = ht.homework_id
    WHERE ha.user_id = $1
    GROUP BY h.id, s.name
    ORDER BY h.deadline;
  `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
  }

  static async getHomeworkById(homeworkId) {
    const query = `
        SELECT *
        FROM homeworks
        WHERE id = $1
    `;

    const { rows } = await pool.query(query, [homeworkId]);
    return rows[0];
  }

  static async getHomeworkTasks(homeworkId) {
    const query = `
        SELECT 
            t.id,
            t.question,
            t.points
        FROM homework_tasks ht
        JOIN tasks t ON t.id = ht.task_id
        WHERE ht.homework_id = $1
        ORDER BY ht.order_index
    `;

    const { rows } = await pool.query(query, [homeworkId]);
    return rows;
  }

}

