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
    SELECT
      h.id,
      h.title,
      h.deadline,

      t.id as topic_id,
      t.name as topic_name,
      t.subject_code as topic_code,
      t.number as topic_number

    FROM homeworks h
    JOIN topics t ON t.id = h.topic_id
    WHERE h.id = $1
  `;

    const { rows } = await pool.query(query, [homeworkId]);

    return rows[0];
  }

  static async getHomeworkTasks(homeworkId) {

    const query = `
    SELECT 
        ht.task_id AS id,
        t.content,
        t.points
    FROM homework_tasks ht
    LEFT JOIN tasks t ON t.id = ht.task_id
    WHERE ht.homework_id = $1
    ORDER BY ht.order_index ASC, ht.task_id ASC
  `;

    const { rows } = await pool.query(query, [homeworkId]);

    return rows;
  }

}

