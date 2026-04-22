import pool from '../config/db.js';

export default class TaskModel {
  static topicsSubjectColumn = null;

  static async resolveTopicsSubjectColumn() {
    if (this.topicsSubjectColumn) {
      return this.topicsSubjectColumn;
    }

    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'topics'
        AND column_name IN ('subject_id', 'subject_code')
    `;

    const { rows } = await pool.query(query);
    const columnNames = rows.map(row => row.column_name);

    if (columnNames.includes('subject_id')) {
      this.topicsSubjectColumn = 'subject_id';
      return this.topicsSubjectColumn;
    }

    if (columnNames.includes('subject_code')) {
      this.topicsSubjectColumn = 'subject_code';
      return this.topicsSubjectColumn;
    }

    throw new Error('Topics table has no subject reference column');
  }

  static async getTaskById(taskId) {

    const query = `
      SELECT id, content, original_tex, difficulty, answer_format, topic_id, points
      FROM tasks
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [taskId]);

    return rows[0];
  }

  static async getTasksByTopicId(topicId){
    const query = `
    SELECT id, content, original_tex, difficulty, answer_format, topic_id, points
      FROM tasks
      WHERE topic_id = $1
    `;

    const { rows } = await pool.query(query, [taskId]);

    return rows[0];
  }

  static async getTaskByIdForCheck(taskId) {
    const query = `
      SELECT id, correct_answer, points
      FROM tasks
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [taskId]);
    return rows[0];
  }

  static async getByNumber(taskNumber, subjectId) {
    const subjectColumn = await this.resolveTopicsSubjectColumn();
    let query = '';
    let params = [taskNumber, subjectId];

    if (subjectColumn === 'subject_id') {
      query = `
      SELECT 
        t.id,
        t.content,
        t.original_tex,
        t.answer_format,
        t.difficulty,
        t.topic_id,
        tp.number as task_number
      FROM tasks t
      JOIN topics tp ON t.topic_id = tp.id
      WHERE tp.number = $1
        AND tp.subject_id = $2
    `;
    } else {
      query = `
      SELECT 
        t.id,
        t.content,
        t.original_tex,
        t.answer_format,
        t.difficulty,
        t.topic_id,
        tp.number as task_number
      FROM tasks t
      JOIN topics tp ON t.topic_id = tp.id
      JOIN subjects s ON s.code = tp.subject_code
      WHERE tp.number = $1
        AND s.id = $2
    `;
    }

    const { rows } = await pool.query(query, params);

    return rows;
  }

  static async getSubjectByCode(subjectCode) {
    const query = `
      SELECT id, name, code
      FROM subjects
      WHERE code = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [subjectCode]);
    return rows[0] || null;
  }

  static async getCountsByNumberAndDifficulty(subjectCode, taskNumbers) {
    const subjectColumn = await this.resolveTopicsSubjectColumn();
    let query = '';
    const params = [taskNumbers, subjectCode];

    if (subjectColumn === 'subject_id') {
      query = `
      SELECT
        tp.number AS task_number,
        LOWER(t.difficulty) AS difficulty,
        COUNT(*)::int AS count
      FROM tasks t
      JOIN topics tp ON t.topic_id = tp.id
      JOIN subjects s ON s.id = tp.subject_id
      WHERE tp.number = ANY($1::int[])
        AND s.code = $2
      GROUP BY tp.number, LOWER(t.difficulty)
      ORDER BY tp.number ASC, LOWER(t.difficulty) ASC
    `;
    } else {
      query = `
      SELECT
        tp.number AS task_number,
        LOWER(t.difficulty) AS difficulty,
        COUNT(*)::int AS count
      FROM tasks t
      JOIN topics tp ON t.topic_id = tp.id
      WHERE tp.number = ANY($1::int[])
        AND tp.subject_code = $2
      GROUP BY tp.number, LOWER(t.difficulty)
      ORDER BY tp.number ASC, LOWER(t.difficulty) ASC
    `;
    }

    const { rows } = await pool.query(query, params);
    return rows;
  }

}
