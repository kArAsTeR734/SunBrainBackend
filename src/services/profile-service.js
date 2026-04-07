import UserModel from '../models/user-model.js';
import LeaderboardModel from '../models/leaderboard-model.js';

class ProfileService {
  static async getProfileData(userId) {
    const user = await UserModel.getProfile(userId);

    return {
      user: {
        id: user?.id,
        email: user?.email,
        fullName: user?.full_name,
        role: user?.role,
        avatarUrl: user?.avatar_url || null
      },
    };
  }
}

export default ProfileService;