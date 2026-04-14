import TaskModel from '../models/task-model.js';
import HomeworkAnswerModel from '../models/homework-answer-model.js';
import pool from '../config/db.js';

class TaskService {
  static TEST_TASK_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

  static TEST_MIN_TOTAL_TASKS = 20;

  static TEST_MAX_TOTAL_TASKS = 24;

  static TEST_TASKS_PER_NUMBER_MIN = 1;

  static TEST_TASKS_PER_NUMBER_MAX = 2;

  static TEST_DIFFICULTIES = ['easy', 'medium', 'hard'];

  static normalizeAnswer(value) {
    return String(value ?? '').trim().toLowerCase();
  }

  static async checkTaskAnswer({ userId, taskId, answer }) {
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
      task
    };
  }

  static async generateTestTasks(subjectId) {
    const result = [];
    const numbersMeta = [];

    for (const taskNumber of this.TEST_TASK_NUMBERS) {
      const tasks = await TaskModel.getByNumber(taskNumber, subjectId);
      const groupedTasks = this.groupByDifficulty(tasks);
      const availableDifficulties = Object.keys(groupedTasks);

      if (availableDifficulties.length === 0) {
        throw new Error(`No tasks found for task number ${taskNumber}`);
      }

      numbersMeta.push({
        taskNumber,
        groupedTasks,
        availableDifficulties,
        canPickTwo: availableDifficulties.length >= 2
      });
    }

    const plannedCounts = this.planTasksCountByNumber(numbersMeta);

    for (const meta of numbersMeta) {
      const tasksCount = plannedCounts[meta.taskNumber] || 1;
      const selectedDifficulties = this.pickUniqueDifficulties(
        meta.availableDifficulties,
        tasksCount
      );

      for (const difficulty of selectedDifficulties) {
        result.push(this.getRandom(meta.groupedTasks[difficulty], meta.taskNumber, difficulty));
      }
    }

    return result;
  }

  static planTasksCountByNumber(numbersMeta) {
    const counts = {};

    for (const meta of numbersMeta) {
      counts[meta.taskNumber] = this.TEST_TASKS_PER_NUMBER_MIN;
    }

    const totalNumbers = numbersMeta.length;
    const minPossible = totalNumbers * this.TEST_TASKS_PER_NUMBER_MIN;
    const twoTaskCandidates = numbersMeta.filter(meta => meta.canPickTwo);
    const maxPossible = minPossible + twoTaskCandidates.length;

    const minTarget = Math.max(this.TEST_MIN_TOTAL_TASKS, minPossible);
    const maxTarget = Math.min(this.TEST_MAX_TOTAL_TASKS, maxPossible);

    if (minTarget > maxTarget) {
      throw new Error(
        `Cannot build test with requested size: available range is ${minPossible}-${maxPossible}`
      );
    }

    const targetTotal = this.randomInt(minTarget, maxTarget);
    const extraTasksNeeded = targetTotal - minPossible;

    const selectedForTwo = this.pickRandomItems(twoTaskCandidates, extraTasksNeeded);

    for (const meta of selectedForTwo) {
      counts[meta.taskNumber] = 2;
    }

    return counts;
  }

  static groupByDifficulty(tasks) {
    const grouped = {};

    for (const difficulty of this.TEST_DIFFICULTIES) {
      const items = tasks.filter(
        task => String(task.difficulty || '').toLowerCase() === difficulty
      );

      if (items.length > 0) {
        grouped[difficulty] = items;
      }
    }

    return grouped;
  }

  static pickUniqueDifficulties(availableDifficulties, count) {
    const shuffled = [...availableDifficulties].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  static pickRandomItems(items, count) {
    if (count <= 0) {
      return [];
    }

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static getRandom(arr, taskNumber, difficulty) {
    if (!arr.length) {
      throw new Error(
        `No tasks for task number ${taskNumber} and difficulty ${difficulty}`
      );
    }

    return arr[Math.floor(Math.random() * arr.length)];
  }
}

export default TaskService;
