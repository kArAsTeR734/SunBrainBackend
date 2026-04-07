import LeaderboardService from '../services/leaderboard-service.js';
import {successResponse, errorResponse} from '../utils/ApiError.js';

class LeaderboardController {

  static async getProfileLeaderboard(req, res) {

    try {
      const userId = req.userId

      const data = await LeaderboardService.getProfileLeaderboard(userId);

      res.status(200).json(
        successResponse(data)
      );

    } catch (error) {

      console.error(error);

      res.status(500).json(
        errorResponse('Ошибка получения рейтинга')
      );

    }
  }

  static async getAllLeaderboard(req, res) {
    try {
      const data = await LeaderboardService.getLeaderboardTotal();

      res.status(200).json(
        successResponse(data)
      )
    } catch (error) {
      console.log(error);

      res.status(500).json(
        errorResponse('Ошибка получения рейтинга')
      )
    }
  }

}

export default LeaderboardController;