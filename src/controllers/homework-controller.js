import HomeworkService from '../services/homework-service.js';
import TaskService from '../services/task-service.js';
import { errorResponse, successResponse } from '../utils/ApiError.js';

class HomeworkController {
  static async checkTaskAnswer(req, res) {
    try {
      const userId = req.userId;
      const { taskId } = req.params;
      const { answer } = req.body;

      if (typeof answer !== 'string' || !answer.trim()) {
        return res.status(400).json(
          errorResponse('Answer is required')
        );
      }

      const result = await TaskService.checkTaskAnswer({
        userId,
        taskId,
        answer
      });

      return res.status(200).json(
        successResponse(result)
      );
    } catch (error) {
      console.error(error);

      let status = 500;
      let message = 'Failed to check homework answer';

      if (error.message === 'User is not authenticated') {
        status = 401;
        message = 'User is not authenticated';
      } else if (error.message === 'Answer is required') {
        status = 400;
        message = 'Answer is required';
      } else if (error.message === 'Task not found') {
        status = 404;
        message = 'Task not found';
      }

      return res.status(status).json(
        errorResponse(message)
      );
    }
  }

  static async getMyHomeworks(req, res) {
    try {
      const userId = req.userId;
      const data = await HomeworkService.getMyHomeworks(userId);

      return res.status(200).json(
        successResponse(data)
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json(
        errorResponse('Failed to get user homeworks')
      );
    }
  }

  static async getHomework(req, res) {
    try {
      const homeworkId = Number(req.params.id);
      const data = await HomeworkService.getHomework(homeworkId);

      return res.status(200).json(
        successResponse(data)
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json(
        errorResponse('Failed to get homework')
      );
    }
  }
}

export default HomeworkController;
