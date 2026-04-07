import TestModel from '../models/test-model.js';
import TaskService from './task-service.js';
import TestAnswerModel from '../models/test-answer-model.js';

class TestService {
  static async startTest(userId, subjectId) {
    const test = await TestModel.create(userId, subjectId);

    const tasks = await TaskService.generateTestTasks(subjectId);

    await TestModel.addTasks(test.id, tasks);

    return {
      testId: test.id,
      tasks
    };
  }

  static async submitAnswer({ userId, testId, taskId, answer }) {
    const task = await TestModel.getTaskById(taskId);

    const isCorrect =
      task.correct_answer.trim().toLowerCase() ===
      answer.trim().toLowerCase();

    await TestAnswerModel.create({
      userId,
      testId,
      taskId,
      taskNumber: task.task_number,
      difficulty: task.difficulty,
      answer,
      isCorrect
    });

    return { isCorrect };
  }

  static async finishTest(testId, userId) {
    const answers = await TestAnswerModel.getByTest(testId);

    const masteryMap = {};

    for (const ans of answers) {
      if (!masteryMap[ans.task_number]) {
        masteryMap[ans.task_number] = [];
      }
      masteryMap[ans.task_number].push(ans);
    }

    const result = {};

    for (const taskNumber in masteryMap) {
      const attempts = masteryMap[taskNumber];

      const allCorrect =
        attempts.length === 3 &&
        attempts.every(a => a.is_correct);

      result[taskNumber] = allCorrect;
    }

    await TestModel.finish(testId);

    return result;
  }
}

export default TestService;