import UserModel from '../models/user-model.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class AvatarService {
  static AVATAR_DIR = 'uploads/avatars';
  static ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  static MAX_SIZE = 5 * 1024 * 1024; // 5MB

  static initUploadDir() {
    if (!fs.existsSync(this.AVATAR_DIR)) {
      fs.mkdirSync(this.AVATAR_DIR, { recursive: true });
    }
  }

  static validateFile(file) {
    // Проверка типа
    if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
      throw new Error(`Неподдерживаемый тип файла. Допустимые: ${this.ALLOWED_TYPES.join(', ')}`);
    }

    // Проверка размера
    if (file.size > this.MAX_SIZE) {
      throw new Error(`Файл слишком большой. Максимальный размер: ${this.MAX_SIZE / 1024 / 1024}MB`);
    }

    return true;
  }

  static generateFileName(originalName) {
    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}`;
    return filename;
  }

  static async saveFile(file) {
    this.initUploadDir();
    this.validateFile(file);

    const filename = this.generateFileName(file.originalname);
    const filepath = path.join(this.AVATAR_DIR, filename);

    await fs.promises.writeFile(filepath, file.buffer);

    // Генерируем URL для доступа
    const avatarUrl = `/uploads/avatars/${filename}`;

    return {
      filename,
      filepath,
      avatarUrl,
      mimetype: file.mimetype,
      size: file.size
    };
  }

  static async deleteOldAvatar(avatarUrl) {
    if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) {
      return;
    }

    const filename = path.basename(avatarUrl);
    const filepath = path.join(this.AVATAR_DIR, filename);

    try {
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        console.log(`Удалён старый файл аватарки: ${filename}`);
      }
    } catch (error) {
      console.error('Ошибка при удалении старого файла аватарки:', error);
    }
  }

  static async uploadAvatar(userId, file) {
    // Получаем текущего пользователя
    const user = await UserModel.findById(userId);

    if (user?.avatar_url) {
      await this.deleteOldAvatar(user.avatar_url);
    }

    const fileInfo = await this.saveFile(file);

    const updatedUser = await UserModel.updateAvatar(userId, fileInfo.avatarUrl);

    return {
      user: updatedUser,
      fileInfo
    };
  }

  static async deleteAvatar(userId) {
    const user = await UserModel.findById(userId);

    if (user?.avatar_url) {
      await this.deleteOldAvatar(user.avatar_url);
    }

    const updatedUser = await UserModel.deleteAvatar(userId);

    return updatedUser;
  }

  static async getAvatar(userId) {
    const user = await UserModel.findById(userId);

    if (!user?.avatar_url) {
      return null;
    }

    const filename = path.basename(user.avatar_url);
    const filepath = path.join(this.AVATAR_DIR, filename);

    if (!fs.existsSync(filepath)) {
      await UserModel.deleteAvatar(userId);
      return null;
    }

    return {
      avatarUrl: user.avatar_url,
      filepath
    };
  }
}

export default AvatarService;