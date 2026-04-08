import TestModel from '../models/test-models.js';
import TaskService from './task-service.js';
import TestAnswerModel from '../models/test-answer-model.js';
import AIHomeworkService from './ai-homework-service.js';

class TestService {
  static async startTest(userId, subjectId) {
    const normalizedSubjectId = Number(subjectId);

    if (!userId) {
      throw new Error('User is not authenticated');
    }

    if (!Number.isInteger(normalizedSubjectId) || normalizedSubjectId <= 0) {
      throw new Error('subjectId must be a positive integer');
    }

    const test = await TestModel.create(userId, normalizedSubjectId);

    const tasks = await TaskService.generateTestTasks(normalizedSubjectId);

    await TestModel.addTasks(test.id, tasks);

    return {
      testId: test.id,
      tasks
    };
  }

  static async submitAnswer({ userId, testId, taskId, answer }) {
    const normalizedTestId = Number(testId);
    const normalizedTaskId = Number(taskId);

    if (!userId) {
      throw new Error('User is not authenticated');
    }

    if (typeof answer !== 'string' || !answer.trim()) {
      throw new Error('Answer is required');
    }

    const test = await TestModel.getByIdForUser(normalizedTestId, userId);
    if (!test) {
      throw new Error('Test not found');
    }

    const task = await TestModel.getTestTaskById(normalizedTestId, normalizedTaskId);
    if (!task) {
      throw new Error('Task is not included in this test');
    }

    const isCorrect =
      task.correct_answer.trim().toLowerCase() ===
      answer.trim().toLowerCase();

    await TestAnswerModel.create({
      userId,
      testId: normalizedTestId,
      taskId: normalizedTaskId,
      taskNumber: task.task_number,
      difficulty: task.test_difficulty || task.difficulty,
      answer,
      isCorrect
    });

    return { isCorrect };
  }

  static async finishTest(testId, userId) {
    const normalizedTestId = Number(testId);

    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const test = await TestModel.getByIdForUser(normalizedTestId, userId);
    if (!test) {
      throw new Error('Test not found');
    }

    const answers = await TestAnswerModel.getByTest(normalizedTestId);
    const taskNumbers = await TestModel.getTaskNumbersByTest(normalizedTestId);

    const masteryMap = {};

    for (const ans of answers) {
      if (!masteryMap[ans.task_number]) {
        masteryMap[ans.task_number] = [];
      }
      masteryMap[ans.task_number].push(ans);
    }

    const result = {};

    for (const taskNumber of taskNumbers) {
      const attempts = masteryMap[taskNumber] || [];

      const allCorrect =
        attempts.length === 3 &&
        attempts.every(a => a.is_correct);

      result[taskNumber] = allCorrect;
    }

    const totalQuestions = Object.keys(result).length;
    const correctAnswers = Object.values(result).filter(Boolean).length;
    const failedTaskNumbers = Object.entries(result)
      .filter(([, isMastered]) => !isMastered)
      .map(([taskNumber]) => Number(taskNumber));

    await TestModel.finish(normalizedTestId, {
      totalQuestions,
      correctAnswers
    });

    let generatedHomeworks = [];
    let generationErrors = [];

    if (failedTaskNumbers.length > 0) {
      const generationResult = await AIHomeworkService.createForTaskNumbers({
        userId,
        subjectId: test.subject_id,
        taskNumbers: failedTaskNumbers
      });

      generatedHomeworks = generationResult.created;
      generationErrors = generationResult.failed;
    }

    return {
      masteryByTaskNumber: result,
      failedTaskNumbers,
      generatedHomeworks,
      generationErrors
    };
  }
}

export default TestService;
