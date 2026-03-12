import TaskModel from '../models/task-model.js';
import HomeworkAnswerModel from '../models/homework-answer-model.js';

class TaskService {

  static async checkTaskAnswer({ userId, taskId, answer }) {

    const task = await TaskModel.getTaskById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    const isCorrect = task.correct_answer === answer;

    const points = isCorrect ? task.points : 0;

    await HomeworkAnswerModel.createAnswer({
      userId,
      taskId,
      answer,
      isCorrect,
      points
    });

    return {
      correct: isCorrect,
      points
    };

  }

}

export default TaskService;