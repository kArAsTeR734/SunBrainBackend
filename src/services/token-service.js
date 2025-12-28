import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config.js';

class TokenService {
    static generateAccessToken(payload) {
        return jwt.sign(payload, jwtConfig.accessSecret, {
            expiresIn: jwtConfig.accessExpiresIn
        });
    }

    static generateRefreshToken(payload) {
        return jwt.sign(payload, jwtConfig.refreshSecret, {
            expiresIn: jwtConfig.refreshExpiresIn
        });
    }

    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, jwtConfig.accessSecret);
        } catch (error) {
            return null;
        }
    }

    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, jwtConfig.refreshSecret);
        } catch (error) {
            return null;
        }
    }

    static generateTokens(userData) {
        const payload = {
            userId: userData.id,
            email: userData.email,
            role: userData.role
        };

        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload)
        };
    }
}

export default TokenService;