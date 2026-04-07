import { Router } from 'express';
import TaskController from '../controllers/task-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const testRouter = new Router();

testRouter.post(
  '/:taskId/check',
  authMiddleware,
  TaskController.checkAnswer
);

export default testRouter;
