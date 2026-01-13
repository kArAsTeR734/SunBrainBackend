import UserModel from '../models/user-model.js';
import LeaderboardModel from '../models/leaderboard-model.js';

class ProfileService {
  static async getProfileData(userId) {
    const user = await UserModel.getProfile(userId);
    const topUsers = await LeaderboardModel.getTopUsers();
    const userData = await LeaderboardModel.getUserData(userId) || { total_points: 0, full_name: user?.full_name };
    const userPosition = await LeaderboardModel.getUserPosition(userId);

    return {
      user: {
        id: user?.id,
        email: user?.email,
        fullName: user?.full_name,
        role: user?.role,
        avatarUrl: user?.avatar_url || this.getDefaultAvatar(user?.full_name)
      },
      leaderboard: {
        topUsers: topUsers.map((user, index) => ({
          fullName: user.full_name,
          points: user.total_points,
          position: index + 1
        })),
        currentUser: {
          fullName: userData.full_name,
          points: userData.total_points || 0,
          position: userPosition
        }
      }
    };
  }

  static getDefaultAvatar(fullName) {
    if (!fullName) return null;

    const initials = fullName
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#4A90E2" rx="50"/>
      <text x="50" y="50" font-family="Arial" font-size="40" fill="white" 
            text-anchor="middle" dy=".3em">${initials}</text>
    </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

export default ProfileService;