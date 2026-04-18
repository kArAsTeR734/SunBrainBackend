import TestModel from '../models/test-models.js';
import TaskService from './task-service.js';
import TestAnswerModel from '../models/test-answer-model.js';
import AIHomeworkService from './ai-homework-service.js';

class TestService {
  static async getPoolMeta(subjectCode) {
    return TaskService.getTestPoolMeta(subjectCode);
  }

  static async getTestCounts(testId, userId) {
    const normalizedTestId = Number(testId);

    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const test = await TestModel.getByIdForUser(normalizedTestId, userId);
    if (!test) {
      throw new Error('Test not found');
    }

    const countsByNumber = await TestModel.getTaskCountsByTest(normalizedTestId);
    const totalTasks = countsByNumber.reduce((sum, item) => sum + item.count, 0);

    return {
      testId: normalizedTestId,
      subjectId: test.subject_id,
      totalTasks,
      countsByNumber
    };
  }

  static async startTest(userId, subjectCode) {
    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const meta = await TaskService.getTestPoolMeta(subjectCode);
    const normalizedSubjectId = Number(meta.subjectId);

    if (!meta.canBuildTarget) {
      throw new Error(
        `Cannot build test with target ${meta.targetTotalTasks}: available range is ${meta.minPossibleTotalTasks}-${meta.maxPossibleTotalTasks}`
      );
    }

    const test = await TestModel.create(userId, normalizedSubjectId);

    const tasks = await TaskService.generateTestTasks(normalizedSubjectId);

    await TestModel.addTasks(test.id, tasks);

    const countsByNumber = await TestModel.getTaskCountsByTest(test.id);
    const publicTasks = tasks.map((task, index) =>
      TaskService.buildPublicTestTask(task, index)
    );

    return {
      testId: test.id,
      subjectId: normalizedSubjectId,
      subjectCode: meta.subjectCode,
      targetTotalTasks: TaskService.TEST_TARGET_TOTAL_TASKS,
      totalTasks: publicTasks.length,
      countsByNumber,
      tasks: publicTasks
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

    const taskPlan = await TestModel.getTaskPlanByTest(normalizedTestId);
    const latestAnswers = await TestAnswerModel.getLatestByTestAndTask(
      normalizedTestId
    );

    const expectedTasksByNumber = {};
    for (const item of taskPlan) {
      if (!expectedTasksByNumber[item.taskNumber]) {
        expectedTasksByNumber[item.taskNumber] = [];
      }
      expectedTasksByNumber[item.taskNumber].push(item.taskId);
    }

    const latestAnswerByTaskId = {};
    for (const answer of latestAnswers) {
      latestAnswerByTaskId[Number(answer.task_id)] = answer;
    }

    const result = {};

    for (const [taskNumber, expectedTaskIds] of Object.entries(
      expectedTasksByNumber
    )) {
      const hasAllAnswers = expectedTaskIds.every(
        taskId => latestAnswerByTaskId[taskId]
      );

      const allCorrect =
        hasAllAnswers &&
        expectedTaskIds.every(taskId => latestAnswerByTaskId[taskId].is_correct);

      result[taskNumber] = allCorrect;
    }

    const totalQuestions = taskPlan.length;
    const correctAnswers = taskPlan.filter(
      item => latestAnswerByTaskId[item.taskId]?.is_correct
    ).length;
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
      totalTasks: totalQuestions,
      correctTasks: correctAnswers,
      masteryByTaskNumber: result,
      failedTaskNumbers,
      generatedHomeworks,
      generationErrors
    };
  }
}

export default TestService;
