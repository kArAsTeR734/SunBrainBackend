import express from 'express';
import AuthController from '../../controllers/auth-controller.js';
import { authMiddleware, roleMiddleware } from '../../middleware/auth-middleware.js';
import { validateRegistration, validateLogin } from '../../middleware/validation-middleware.js';

const router = express.Router();

router.post('/register', validateRegistration, AuthController.registration);
router.post('/login', validateLogin, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.get('/validate', AuthController.validate);

router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.getCurrentUser);

router.get('/admin', authMiddleware, roleMiddleware('admin'), (req, res) => {
    res.json({ message: 'Доступно только админам' });
});

router.get('/teacher', authMiddleware, roleMiddleware('teacher', 'admin'), (req, res) => {
    res.json({ message: 'Доступно учителям и админам' });
});

export default router;