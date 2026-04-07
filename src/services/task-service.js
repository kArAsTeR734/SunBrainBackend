import TaskModel from '../models/task-model.js';
import HomeworkAnswerModel from '../models/homework-answer-model.js';
import pool from '../config/db.js';

class TaskService {
  static normalizeAnswer(value) {
    return String(value ?? '').trim().toLowerCase();
  }

  static async checkTaskAnswer({userId, taskId, answer}) {
    if (!userId) {
      throw new Error('User is not authenticated');
    }

    if (typeof answer !== 'string' || !answer.trim()) {
      throw new Error('Answer is required');
    }

    const task = await TaskModel.getTaskById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    const isCorrect =
      this.normalizeAnswer(task.correct_answer) ===
      this.normalizeAnswer(answer);

    const points = isCorrect ? Number(task.points) || 0 : 0;

    await HomeworkAnswerModel.createAnswer({
      userId,
      taskId,
      answer,
      isCorrect,
      points
    });

    const leaderboardUpdate = await pool.query(
      `
      UPDATE leaderboard
      SET total_points = total_points + $1,
          tasks_solved = tasks_solved + 1,
          correct_solutions = correct_solutions + $2,
          last_activity_at = NOW()
      WHERE user_id = $3
      `,
      [points, isCorrect ? 1 : 0, userId]
    );

    if (leaderboardUpdate.rowCount === 0) {
      await pool.query(
        `
        INSERT INTO leaderboard (
          user_id,
          total_points,
          tasks_solved,
          correct_solutions,
          last_activity_at,
          created_at
        )
        VALUES ($1, $2, 1, $3, NOW(), NOW())
        `,
        [userId, points, isCorrect ? 1 : 0]
      );
    }

    return {
      correct: isCorrect,
      points
    };
  }

  static async getTask(taskId) {
    if (!taskId) {
      throw new Error('Task with this taskId not found');
    }

    const task = await TaskModel.getTaskById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    return {
      task: task
    }
  }

  static async generateTestTasks(subjectId) {
    const result = [];

    for (let i = 1; i <= 25; i++) {
      const tasks = await TaskModel.getByNumber(i, subjectId);

      const easy = tasks.filter(t => t.difficulty === 'easy');
      const medium = tasks.filter(t => t.difficulty === 'medium');
      const hard = tasks.filter(t => t.difficulty === 'hard');

      result.push(
        this.getRandom(easy),
        this.getRandom(medium),
        this.getRandom(hard)
      );
    }

    return result;
  }

  static getRandom(arr, number, difficulty) {
    if (!arr.length) {
      throw new Error(`Нет задач для ${number} ${difficulty}`);
    }
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

export default TaskService;
