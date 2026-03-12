import UserModel from '../models/user-model.js';
import LeaderboardModel from '../models/leaderboard-model.js';

class ProfileService {
  static async getProfileData(userId) {
    const user = await UserModel.getProfile(userId);
    const topUsers = await LeaderboardModel.getTopUsers();

    const userData = await LeaderboardModel.getUserData(userId) || { total_points: 0, full_name: user?.full_name };

    return {
      user: {
        id: user?.id,
        email: user?.email,
        fullName: user?.full_name,
        role: user?.role,
        avatarUrl: user?.avatar_url || null
      },
      leaderboard: {
        topUsers: topUsers.map((user, index) => ({
          fullName: user.full_name,
          points: user.total_points,
          position: index + 1
        })),
        currentUser: {
          fullName: userData.full_name,
          points: userData.total_points,
          position: 0
        }
      }
    };
  }
}

export default ProfileService;