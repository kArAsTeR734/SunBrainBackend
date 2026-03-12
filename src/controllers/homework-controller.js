import HomeworkService from '../services/homework-service.js';
import {errorResponse, successResponse} from "../utils/ApiError.js";

class HomeworkController {

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