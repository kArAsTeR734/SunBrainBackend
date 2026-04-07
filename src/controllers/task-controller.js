import TaskService from '../services/task-service.js';
import {successResponse, errorResponse} from '../utils/ApiError.js';

class TaskController {
  static async checkAnswer(req, res) {
    try {
      const userId = req.userId;
      const {taskId} = req.params;
      const {answer} = req.body;

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
      let message = 'Failed to check answer';

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

  static async getTask(req, res) {
    try {
      const {taskId} = req.params;

      const task = await TaskService.getTask(taskId);

      return res.status(200).json(
        successResponse(task)
      );

    } catch (error) {
      console.log(error);

      let status = 500;
      let message = 'Failed to get Task';

      if (error.message === 'User is not authenticated') {
        status = 401;
        message = 'User is not authenticated';
      } else if (error.message === 'Answer is required') {
        status = 400;
        message = 'Task id is required';
      } else if (error.message === 'Task not found') {
        status = 404;
        message = 'Task not found';
      }

      return res.status(status).json(
        errorResponse(message)
      );
    }
  }
}

export default TaskController;
