import { jwtConfig } from '../config/jwt.config.js';
import AuthService from '../services/auth-service.js';

class AuthController {
    static async registration(req, res, next) {
        try {
            const { email, password, fullName, role } = req.body;
            const result = await AuthService.register({
                email,
                password,
                fullName,
                role
            });

            res.cookie('refreshToken', result.tokens.refreshToken, jwtConfig.cookieOptions);

            res.status(201).json({
                success: true,
                message: 'Регистрация прошла успешно',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Вход
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await AuthService.login({
                email,
                password
            });

            res.cookie('refreshToken', result.tokens.refreshToken, jwtConfig.cookieOptions);

            res.status(200).json({
                success: true,
                message: 'Вход выполнен успешно',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async logout(req, res, next) {
        try {
            const userId = req.userId; // Из middleware
            const result = await AuthService.logout(userId);

            // Удаляем cookie
            res.clearCookie('refreshToken');

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;

            const result = await AuthService.refresh(refreshToken);

            // Устанавливаем новый refresh токен в cookie
            res.cookie('refreshToken', result.tokens.refreshToken, jwtConfig.cookieOptions);

            res.status(200).json({
                success: true,
                message: 'Токены обновлены',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCurrentUser(req, res, next) {
        try {
            const userId = req.userId;
            const user = await AuthService.getCurrentUser(userId);

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    static async validate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    message: 'Токен отсутствует'
                });
            }

            const token = authHeader.split(' ')[1];
            const userData = AuthService.validateToken(token);

            res.status(200).json({
                success: true,
                data: userData
            });
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;