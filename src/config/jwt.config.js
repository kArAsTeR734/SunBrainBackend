export const jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15s',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '30d',

    // Cookie настройки
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
};