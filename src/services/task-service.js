import TaskModel from '../models/task-model.js';
import HomeworkAnswerModel from '../models/homework-answer-model.js';
import pool from '../config/db.js';
import { normalizeTaskContent } from '../utils/task-content-utils.js';

class TaskService {
  static TEST_TASK_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

  static TEST_SUBJECT_CODES = ['emath', 'omath', 'ephysic', 'ophysic'];

  static TEST_TARGET_TOTAL_TASKS = 20;

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

    const task = await TaskModel.getTaskByIdForCheck(taskId);

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

  static async getTestPoolMeta(subjectCode) {
    const normalizedSubjectCode = String(subjectCode || '')
      .trim()
      .toLowerCase();

    if (!normalizedSubjectCode) {
      throw new Error('subjectCode is required');
    }

    if (!this.TEST_SUBJECT_CODES.includes(normalizedSubjectCode)) {
      throw new Error('subjectCode is not supported');
    }

    const subject = await TaskModel.getSubjectByCode(normalizedSubjectCode);
    if (!subject) {
      throw new Error('Subject not found');
    }

    const rows = await TaskModel.getCountsByNumberAndDifficulty(
      normalizedSubjectCode,
      this.TEST_TASK_NUMBERS
    );

    const byNumber = {};

    for (const taskNumber of this.TEST_TASK_NUMBERS) {
      byNumber[taskNumber] = {
        taskNumber,
        availableTotal: 0,
        availableByDifficulty: {
          easy: 0,
          medium: 0,
          hard: 0
        },
        maxSelectableForTest: 0
      };
    }

    for (const row of rows) {
      const taskNumber = Number(row.task_number);
      const difficulty = String(row.difficulty || '').toLowerCase();
      const count = Number(row.count) || 0;

      if (!byNumber[taskNumber]) {
        continue;
      }

      if (!this.TEST_DIFFICULTIES.includes(difficulty)) {
        continue;
      }

      byNumber[taskNumber].availableByDifficulty[difficulty] = count;
      byNumber[taskNumber].availableTotal += count;
    }

    const numbers = this.TEST_TASK_NUMBERS.map(taskNumber => {
      const item = byNumber[taskNumber];
      const availableDifficultiesCount = Object.values(
        item.availableByDifficulty
      ).filter(count => count > 0).length;

      return {
        ...item,
        maxSelectableForTest: Math.min(
          this.TEST_TASKS_PER_NUMBER_MAX,
          availableDifficultiesCount
        )
      };
    });

    const missingNumbers = numbers
      .filter(item => item.maxSelectableForTest === 0)
      .map(item => item.taskNumber);

    const hasMissingNumbers = missingNumbers.length > 0;
    const minPossibleTotalTasks = hasMissingNumbers
      ? 0
      : numbers.length * this.TEST_TASKS_PER_NUMBER_MIN;
    const maxPossibleTotalTasks = hasMissingNumbers
      ? 0
      : numbers.reduce(
          (sum, item) => sum + Math.max(item.maxSelectableForTest, 0),
          0
        );

    const canBuildTarget =
      !hasMissingNumbers &&
      this.TEST_TARGET_TOTAL_TASKS >= minPossibleTotalTasks &&
      this.TEST_TARGET_TOTAL_TASKS <= maxPossibleTotalTasks;

    return {
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      testTaskNumbers: this.TEST_TASK_NUMBERS,
      targetTotalTasks: this.TEST_TARGET_TOTAL_TASKS,
      minPossibleTotalTasks,
      maxPossibleTotalTasks,
      canBuildTarget,
      missingTaskNumbers: missingNumbers,
      numbers
    };
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
    const targetTotal = this.TEST_TARGET_TOTAL_TASKS;
    const targetOutOfRange = targetTotal < minPossible || targetTotal > maxPossible;

    if (targetOutOfRange) {
      throw new Error(
        `Cannot build test with target ${targetTotal}: available range is ${minPossible}-${maxPossible}`
      );
    }

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

  static buildPublicTestTask(task, orderIndex) {
    const normalizedTask = this.normalizeTaskPresentation(task);

    return {
      id: Number(task.id),
      taskNumber: Number(task.task_number),
      orderIndex: Number(orderIndex),
      difficulty: String(task.difficulty || '').toLowerCase(),
      content: normalizedTask.content,
      originalTex: normalizedTask.originalTex,
      answerFormat: task.answer_format || null,
      imageSvg: normalizedTask.payload?.imageSvg || null
    };
  }

  static normalizeTaskPresentation(task) {
    return normalizeTaskContent(task?.content, task?.original_tex || null);
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
