import LeaderboardModel from '../models/leaderboard-model.js';

class LeaderboardService {

  static async getLeaderboardTotal() {

    const users = await LeaderboardModel.getLeaderboard();

    return {
      leaderboard: users.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        name: user.name,
        points: user.total_points
      }))
    };
  }

  static async getProfileLeaderboard(userId) {
    const topUsers = await LeaderboardModel.getTopUsers();
    const userData = await LeaderboardModel.getUserData(userId);
    return {
      topUsers: topUsers.map((user, index) => ({
        fullName: user.full_name,
        points: user.total_points,
        position: index + 1
      })),

      currentUser: {
        fullName: userData?.full_name,
        points: userData?.total_points || 0,
        position: userData?.position || null
      }
    };
  }

}

export default LeaderboardService;