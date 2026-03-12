import TaskService from '../services/task-service.js';
import { successResponse, errorResponse } from '../utils/ApiError.js';

class TaskController {

  static async checkAnswer(req, res) {

    try {

      const userId = req.userId;
      const { taskId } = req.params;
      const { answer } = req.body;

      const result = await TaskService.checkTaskAnswer({
        userId,
        taskId,
        answer
      });

      res.status(200).json(
        successResponse(result)
      );

    } catch (error) {

      console.error(error);

      res.status(500).json(
        errorResponse('Ошибка проверки ответа')
      );
    }

  }

}

export default TaskController;