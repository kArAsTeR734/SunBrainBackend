import express from 'express';
import ProfileController from '../../controllers/profile-controller.js';
import {authMiddleware} from '../../middleware/auth-middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/me', authMiddleware, ProfileController.getProfile);

export default router;