import pool from '../config/db.js';

export default class TopicModel {

  static async getTopicsBySubject(subjectId) {

    const query = `
      SELECT
        id,
        number,
        title
      FROM topics
      WHERE subject_id = $1
      ORDER BY number
    `;

    const { rows } = await pool.query(query, [subjectId]);

    return rows;
  }

}