import ProfileService from '../services/profile-service.js';

class ProfileController {
  static async getProfile(req, res) {
    try {
      const userId = req.userId;
      const profileData = await ProfileService.getProfileData(userId);

      res.status(200).json({
        success: true,
        data: profileData
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении профиля'
      });
    }
  }
}

export default ProfileController;