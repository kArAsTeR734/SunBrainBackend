import express from 'express';
import ProfileController from '../../controllers/profile-controller.js';
import {authMiddleware} from '../../middleware/auth-middleware.js';
import {uploadSingle} from "../../middleware/upload-middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get('/me', ProfileController.getProfile);

router.post('/me/avatar', uploadSingle, ProfileController.uploadAvatar);

router.delete('/me/avatar', ProfileController.deleteAvatar);

router.get('/avatar/:userId', ProfileController.getAvatar);

export default router;