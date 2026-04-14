import pool from '../config/db.js';

export default class HomeworkModel {
  static topicsSubjectColumn = null;

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
      s.code as topic_code,
      t.number as topic_number

    FROM homeworks h
    JOIN topics t ON t.id = h.topic_id
    JOIN subjects s ON s.id = h.subject_id
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
        t.solution,
        t.correct_answer,
        t.difficulty,
        t.points AS points
    FROM homework_tasks ht
    LEFT JOIN tasks t ON t.id = ht.task_id
    WHERE ht.homework_id = $1
    ORDER BY ht.order_index ASC, ht.task_id ASC
  `;

    const { rows } = await pool.query(query, [homeworkId]);

    return rows;
  }

  static async getSubjectById(subjectId) {
    const query = `
      SELECT id, name, code
      FROM subjects
      WHERE id = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [subjectId]);
    return rows[0] || null;
  }

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

  static async getTopicByTaskNumber(subjectId, taskNumber) {
    const subjectColumn = await this.resolveTopicsSubjectColumn();
    let query = '';
    let params = [];

    if (subjectColumn === 'subject_id') {
      query = `
        SELECT id, name, number
        FROM topics
        WHERE subject_id = $1
          AND number = $2
        LIMIT 1
      `;
      params = [subjectId, taskNumber];
    } else {
      query = `
        SELECT t.id, t.name, t.number
        FROM topics t
        JOIN subjects s ON s.code = t.subject_code
        WHERE s.id = $1
          AND t.number = $2
        LIMIT 1
      `;
      params = [subjectId, taskNumber];
    }

    const { rows } = await pool.query(query, params);
    return rows[0] || null;
  }

  static buildTaskPayload(task) {
    return JSON.stringify({
      format: 'latex',
      statementLatex: task.statementLatex,
      solutionLatex: task.solutionLatex,
      answerLatex: task.answerLatex,
      imageSvg: task.imageSvg
    });
  }

  static mapDifficultyToPoints(difficulty) {
    switch (difficulty) {
      case 'easy':
        return 1;
      case 'medium':
        return 2;
      case 'hard':
        return 3;
      default:
        return 1;
    }
  }

  static async createAiHomework({
    userId,
    subjectId,
    topicId,
    title,
    tasks
  }) {
    await pool.query('BEGIN');

    try {
      const homeworkResult = await pool.query(
        `
        INSERT INTO homeworks (title, subject_id, topic_id, deadline, created_at, updated_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', NOW(), NOW())
        RETURNING id, title, deadline
        `,
        [title, subjectId, topicId]
      );

      const homework = homeworkResult.rows[0];

      await pool.query(
        `
        INSERT INTO homework_assignments (homework_id, user_id, assigned_at)
        VALUES ($1, $2, NOW())
        `,
        [homework.id, userId]
      );

      for (let index = 0; index < tasks.length; index += 1) {
        const task = tasks[index];
        const points = this.mapDifficultyToPoints(task.difficulty);

        const taskResult = await pool.query(
          `
          INSERT INTO tasks (
            content,
            original_tex,
            solution,
            correct_answer,
            points,
            topic_id,
            difficulty,
            exam_type,
            answer_format,
            created_at,
            updated_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
          RETURNING id
          `,
          [
            this.buildTaskPayload(task),
            task.statementLatex,
            task.solutionLatex,
            task.answerLatex,
            points,
            topicId,
            task.difficulty,
            'ai_generated',
            'latex'
          ]
        );

        const createdTask = taskResult.rows[0];

        await pool.query(
          `
          INSERT INTO homework_tasks (homework_id, task_id, order_index)
          VALUES ($1,$2,$3)
          `,
          [homework.id, createdTask.id, index]
        );
      }

      await pool.query('COMMIT');

      return homework;
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }

}

