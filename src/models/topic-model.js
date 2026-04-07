import pool from '../config/db.js';

export default class TopicModel {

  static async getTopicsBySubject(subjectId) {
    const query = `
    SELECT 
      id,
      number,
      name
    FROM topics
    WHERE subject_code = $1
    ORDER BY number; 
  `;

    const {rows} = await pool.query(query, [subjectId]);
    return rows;
  }

  static async getTopicsByHomeworkId(homeworkId) {
    const query = `
    SELECT 
      id,
      number,
      name,
      subject_code
    FROM topics
    JOIN 
    WHERE subject_code = $1
    ORDER BY number; 
  `;
  }

}