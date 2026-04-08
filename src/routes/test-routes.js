import { Router } from 'express';
import TaskController from '../controllers/task-controller.js';
import TestController from '../controllers/test-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const testRouter = new Router();

testRouter.post('/start', authMiddleware, TestController.startTest);

testRouter.post('/:testId/answer', authMiddleware, TestController.submitAnswer);

testRouter.post('/:testId/finish', authMiddleware, TestController.finishTest);

testRouter.post('/:taskId/check', authMiddleware, TaskController.checkAnswer);

export default testRouter;
