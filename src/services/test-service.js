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

  static async getReview(testId, userId) {
    const normalizedTestId = Number(testId);

    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const test = await TestModel.getByIdForUser(normalizedTestId, userId);
    if (!test) {
      throw new Error('Test not found');
    }

    if (String(test.status || '').toLowerCase() !== 'completed') {
      throw new Error('Test is not completed yet');
    }

    const reviewRows = await TestModel.getReviewByTest(normalizedTestId);
    const answers = reviewRows.map(row => {
      const normalizedTask = TaskService.normalizeTaskPresentation(row);

      return {
        taskId: Number(row.task_id),
        taskNumber: Number(row.task_number),
        orderIndex: Number(row.order_index),
        difficulty: String(row.difficulty || '').toLowerCase(),
        content: normalizedTask.content,
        originalTex: normalizedTask.originalTex,
        answerFormat: row.answer_format || null,
        imageSvg: normalizedTask.payload?.imageSvg || null,
        userAnswer: row.user_answer ?? null,
        correctAnswer: row.correct_answer,
        isCorrect: Boolean(row.is_correct)
      };
    });

    return {
      testId: normalizedTestId,
      subjectId: Number(test.subject_id),
      totalTasks: answers.length,
      correctTasks: answers.filter(item => item.isCorrect).length,
      answers
    };
  }

  static buildOutcome(taskPlan, latestAnswers) {
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

    const masteryByTaskNumber = {};

    for (const [taskNumber, expectedTaskIds] of Object.entries(
      expectedTasksByNumber
    )) {
      const hasAllAnswers = expectedTaskIds.every(
        taskId => latestAnswerByTaskId[taskId]
      );

      const allCorrect =
        hasAllAnswers &&
        expectedTaskIds.every(taskId => latestAnswerByTaskId[taskId].is_correct);

      masteryByTaskNumber[taskNumber] = allCorrect;
    }

    const totalTasks = taskPlan.length;
    const correctTasks = taskPlan.filter(
      item => latestAnswerByTaskId[item.taskId]?.is_correct
    ).length;
    const failedTaskNumbers = Object.entries(masteryByTaskNumber)
      .filter(([, isMastered]) => !isMastered)
      .map(([taskNumber]) => Number(taskNumber));

    return {
      masteryByTaskNumber,
      failedTaskNumbers,
      totalTasks,
      correctTasks
    };
  }

  static async generateHomeworks(testId, userId, requestedTaskNumbers) {
    const normalizedTestId = Number(testId);

    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const test = await TestModel.getByIdForUser(normalizedTestId, userId);
    if (!test) {
      throw new Error('Test not found');
    }

    if (String(test.status || '').toLowerCase() !== 'completed') {
      throw new Error('Test is not completed yet');
    }

    const taskPlan = await TestModel.getTaskPlanByTest(normalizedTestId);
    const latestAnswers = await TestAnswerModel.getLatestByTestAndTask(
      normalizedTestId
    );
    const outcome = this.buildOutcome(taskPlan, latestAnswers);

    const normalizedRequested = [
      ...new Set(
        (Array.isArray(requestedTaskNumbers) ? requestedTaskNumbers : [])
          .map(Number)
          .filter(number => Number.isInteger(number) && number > 0)
      )
    ];

    const targetTaskNumbers =
      normalizedRequested.length > 0
        ? normalizedRequested.filter(taskNumber =>
            outcome.failedTaskNumbers.includes(taskNumber)
          )
        : outcome.failedTaskNumbers;

    if (targetTaskNumbers.length === 0) {
      return {
        testId: normalizedTestId,
        subjectId: Number(test.subject_id),
        generatedFromTaskNumbers: [],
        generatedHomeworks: [],
        generationErrors: []
      };
    }

    const generationResult = await AIHomeworkService.createForTaskNumbers({
      userId,
      subjectId: test.subject_id,
      taskNumbers: targetTaskNumbers
    });

    return {
      testId: normalizedTestId,
      subjectId: Number(test.subject_id),
      generatedFromTaskNumbers: targetTaskNumbers,
      generatedHomeworks: generationResult.created,
      generationErrors: generationResult.failed
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
    const outcome = this.buildOutcome(taskPlan, latestAnswers);

    await TestModel.finish(normalizedTestId, {
      totalQuestions: outcome.totalTasks,
      correctAnswers: outcome.correctTasks
    });

    return {
      totalTasks: outcome.totalTasks,
      correctTasks: outcome.correctTasks,
      masteryByTaskNumber: outcome.masteryByTaskNumber,
      failedTaskNumbers: outcome.failedTaskNumbers,
      hasFailedTaskNumbers: outcome.failedTaskNumbers.length > 0
    };
  }
}

export default TestService;
