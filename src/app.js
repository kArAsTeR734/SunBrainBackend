import 'dotenv/config';

import express from 'express';
import path from "path";

import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth-routes.js';
import profileRoutes from "./routes/profile-routes.js";
import homeworkRoutes from "./routes/homework-routes.js";
import taskRouter from "./routes/task-routes.js";
import topicRouter from "./routes/topic-routes.js";
import leaderboardRoutes from "./routes/leaderboard-routes.js";
import testRouter from "./routes/test-routes.js";

const app = express();

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3031',
    'http://localhost:3030',
    'http://localhost:5173',
    'http://localhost:8080'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `CORS политика не разрешает доступ с origin: ${origin}`;
            return callback(new Error(msg), false);
        }

        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(path.resolve('uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/profile',profileRoutes)
app.use('/api/leaderboard',leaderboardRoutes)
app.use('/api/tasks', taskRouter);
app.use('/api/homework', homeworkRoutes)
app.use('/api/topics', topicRouter)
app.use('/api/tests', testRouter)

app.use((error, req, res, next) => {
    console.error('Ошибка:', error);

    const status = error.status || 500;
    const message = error.message || 'Внутренняя ошибка сервера';

    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📝 Документация API:`);
    console.log(`   POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   POST http://localhost:${PORT}/api/auth/refresh`);
    console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
    console.log(`   GET  http://localhost:${PORT}/api/homework/my`);
});