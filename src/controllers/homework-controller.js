import HomeworkService from '../services/homework-service.js';
import {errorResponse, successResponse} from "../utils/ApiError.js";
import TaskModel from "../models/task-model.js";

class HomeworkController {

  static async checkTaskAnswer(req, res) {
    const { taskId } = req.params;
    const { answer } = req.body;

    const task = await TaskModel.getTaskById(taskId);

    const correct = task.correct_answer === answer;

    res.json(
      successResponse({
        correct,
        points: correct ? task.points : 0
      })
    );
  }

  static async getMyHomeworks(req, res) {
    try {

      const userId = req.userId;

      const data = await HomeworkService.getMyHomeworks(userId);
      console.log(data);

      res.status(200).json(successResponse(data));

    } catch (error) {
      console.error(error);
      res.status(500).json(errorResponse('Ошибка получения домашних заданий'));
    }
  }

  static async getHomework(req, res) {
    try {

      const homeworkId = req.params.id;

      const data = await HomeworkService.getHomework(homeworkId);

      res.status(200).json(
        successResponse(data)
      );

    } catch (error) {

      console.error(error);

      res.status(500).json(
        errorResponse('Ошибка получения домашнего задания')
      );
    }
  }

}

export default HomeworkController;