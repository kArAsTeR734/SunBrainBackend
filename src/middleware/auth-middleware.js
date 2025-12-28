import TokenService from '../services/token-service.js';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Пользователь не авторизован'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Пользователь не авторизован'
            });
        }

        const userData = TokenService.verifyAccessToken(token);
        if (!userData) {
            return res.status(401).json({
                success: false,
                message: 'Недействительный токен'
            });
        }

        req.userId = userData.userId;
        req.userEmail = userData.email;
        req.userRole = userData.role;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Пользователь не авторизован'
        });
    }
};

const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(401).json({
                success: false,
                message: 'Пользователь не авторизован'
            });
        }

        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Недостаточно прав'
            });
        }

        next();
    };
};

export { authMiddleware, roleMiddleware };