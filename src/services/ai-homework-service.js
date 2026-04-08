import aiService from './AIService.js';
import HomeworkModel from '../models/homework-model.js';

class AIHomeworkService {
  static normalizeInteger(value, fieldName) {
    const normalized = Number(value);

    if (!Number.isInteger(normalized) || normalized <= 0) {
      throw new Error(`${fieldName} must be a positive integer`);
    }

    return normalized;
  }

  static async createForTask({ userId, subjectId, taskNumber }) {
    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const normalizedSubjectId = this.normalizeInteger(subjectId, 'subjectId');
    const normalizedTaskNumber = this.normalizeInteger(taskNumber, 'taskNumber');

    const subject = await HomeworkModel.getSubjectById(normalizedSubjectId);
    if (!subject) {
      throw new Error('Subject not found');
    }

    const topic = await HomeworkModel.getTopicByTaskNumber(
      normalizedSubjectId,
      normalizedTaskNumber
    );

    if (!topic) {
      throw new Error(
        `Topic for task number ${normalizedTaskNumber} in subject ${normalizedSubjectId} not found`
      );
    }

    const generated = await aiService.generateHomeworkByTaskNumber({
      subjectName: subject.name,
      topicName: topic.name,
      taskNumber: normalizedTaskNumber,
      tasksPerDifficulty: 5
    });

    const title =
      generated.title || `AI homework for task #${normalizedTaskNumber}`;

    const homework = await HomeworkModel.createAiHomework({
      userId,
      subjectId: normalizedSubjectId,
      topicId: topic.id,
      title,
      tasks: generated.tasks
    });

    return {
      homeworkId: homework.id,
      title: homework.title,
      deadline: homework.deadline,
      subjectId: normalizedSubjectId,
      taskNumber: normalizedTaskNumber,
      topic: {
        id: topic.id,
        number: topic.number,
        name: topic.name
      }
    };
  }

  static async createForTaskNumbers({ userId, subjectId, taskNumbers }) {
    const normalizedUniqueNumbers = [
      ...new Set(
        (Array.isArray(taskNumbers) ? taskNumbers : [])
          .map(Number)
          .filter(number => Number.isInteger(number) && number > 0)
      )
    ];

    const created = [];
    const failed = [];

    for (const taskNumber of normalizedUniqueNumbers) {
      try {
        const homework = await this.createForTask({
          userId,
          subjectId,
          taskNumber
        });

        created.push(homework);
      } catch (error) {
        failed.push({
          taskNumber,
          message: error.message || 'Failed to generate homework'
        });
      }
    }

    return { created, failed };
  }
}

export default AIHomeworkService;
