import express from 'express';
import ProfileController from '../controllers/profile-controller.js';
import {authMiddleware} from '../middleware/auth-middleware.js';
import multer from 'multer';
import {AvatarController} from "../controllers/avatar-controller.js";

const router = express.Router();

const upload = multer({storage: multer.memoryStorage()});

router.get('/me', authMiddleware, ProfileController.getProfile);
router.post('/me/avatar', authMiddleware, upload.single('avatar'), AvatarController.uploadAvatar);

export default router;