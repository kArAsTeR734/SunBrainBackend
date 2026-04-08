import {Router} from "express";
import {authMiddleware} from "../middleware/auth-middleware.js";
import {AIController} from "../controllers/ai-controller.js";

const aiRouter = new Router();

aiRouter.post('/chat', authMiddleware, AIController.chat);

aiRouter.post('/homework/generate', authMiddleware, AIController.generateHomework);

export default aiRouter;
