import TopicService from '../services/topic-service.js';
import { successResponse, errorResponse } from '../utils/ApiError.js';

class TopicController {

  static async getTopics(req, res) {

    try {

      const { subjectId } = req.params;

      const data = await TopicService.getTopics(subjectId);

      res.status(200).json(
        successResponse(data)
      );

    } catch (error) {

      console.error(error);

      res.status(500).json(
        errorResponse('Ошибка получения тем')
      );
    }

  }

}

export default TopicController;