import { body, validationResult } from 'express-validator';

export const validateRegistration = [
    body('email')
        .isEmail()
        .withMessage('Введите корректный email')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 5 })
        .withMessage('Пароль должен быть не менее 5 символов')
        .matches(/\d/)
        .withMessage('Пароль должен содержать хотя бы одну цифру'),

    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Имя обязательно')
        .isLength({ min: 2, max: 100 })
        .withMessage('Имя должно быть от 2 до 100 символов'),

    body('role')
        .optional()
        .isIn(['student', 'teacher', 'admin'])
        .withMessage('Неверная роль пользователя'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Валидация входа
export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Введите корректный email')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Пароль обязателен'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];