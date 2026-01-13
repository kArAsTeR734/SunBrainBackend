import ProfileService from '../services/profile-service.js';
import AvatarService from '../services/avatar-service.js';

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

  static async uploadAvatar(req, res) {
    try {
      const userId = req.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Файл не загружен'
        });
      }

      const result = await AvatarService.uploadAvatar(userId, req.file);

      res.status(200).json({
        success: true,
        message: 'Аватар успешно загружен',
        data: {
          avatarUrl: result.user.avatar_url,
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.full_name
          }
        }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);

      const status = error.message.includes('Неподдерживаемый') ||
      error.message.includes('слишком большой') ? 400 : 500;

      res.status(status).json({
        success: false,
        message: error.message || 'Ошибка при загрузке аватарки'
      });
    }
  }

  static async deleteAvatar(req, res) {
    try {
      const userId = req.userId;

      const updatedUser = await AvatarService.deleteAvatar(userId);

      res.status(200).json({
        success: true,
        message: 'Аватар успешно удалён',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.full_name
          }
        }
      });
    } catch (error) {
      console.error('Delete avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении аватарки'
      });
    }
  }

  static async getAvatar(req, res) {
    try {
      const userId = req.params.userId || req.userId;

      const avatarInfo = await AvatarService.getAvatar(userId);

      if (!avatarInfo) {
        return res.status(404).json({
          success: false,
          message: 'Аватар не найден'
        });
      }

      res.sendFile(avatarInfo.filepath, { root: '.' });
    } catch (error) {
      console.error('Get avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аватарки'
      });
    }
  }
}

export default ProfileController;