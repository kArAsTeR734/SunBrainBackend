import bcrypt from 'bcrypt';
import ApiError from '../utils/ApiError.js';
import UserModel from "../models/user-model.js";
import TokenService from "./token-service.js";
import LeaderboardModel from "../models/leaderboard-model.js";

class AuthService {
    static async register({ email, password, fullName, role = 'student' }) {
        const emailExists = await UserModel.emailExists(email);
        if (emailExists) {
            throw new ApiError(400, 'Пользователь с таким email уже существует');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await UserModel.create({
            email,
            passwordHash,
            fullName,
            role
        });

        const tokens = TokenService.generateTokens(user);

        await UserModel.updateRefreshToken(user.id, tokens.refreshToken);
        await LeaderboardModel.addUserToLeaderboard(user.id)

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
            },
            tokens
        };
    }

    static async login({ email, password }) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            throw new ApiError(401, 'Неверный email или пароль');
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new ApiError(401, 'Неверный email или пароль');
        }

        const tokens = TokenService.generateTokens(user);

        await UserModel.updateRefreshToken(user.id, tokens.refreshToken);

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                avatarUrl:user.avatar_url
            },
            tokens
        };
    }

    static async logout(userId) {
        await UserModel.removeRefreshToken(userId);
        return { message: 'Вы успешно вышли из системы' };
    }

    static async refresh(refreshToken) {
        if (!refreshToken) {
            throw new ApiError(401, 'Refresh токен отсутствует, пройдите авторизацию');
        }

        const userFromDb = await UserModel.findByRefreshToken(refreshToken);
        if (!userFromDb) {
            throw new ApiError(401, 'Недействительный refresh токен, пройдите авторизацию');
        }

        const userData = TokenService.verifyRefreshToken(refreshToken);
        if (!userData) {
            throw new ApiError(401, 'Refresh токен истёк или недействителен, пройдите авторизацию');
        }

        const tokens = TokenService.generateTokens(userFromDb);
        await UserModel.updateRefreshToken(userFromDb.id, tokens.refreshToken);

        return {
            user: {
                id: userFromDb.id,
                email: userFromDb.email,
                fullName: userFromDb.full_name,
                role: userFromDb.role
            },
            tokens
        };
    }
}

export default AuthService;