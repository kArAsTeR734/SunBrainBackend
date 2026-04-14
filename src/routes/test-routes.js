import { Router } from 'express';
import TestController from '../controllers/test-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const testRouter = new Router();

testRouter.post('/start', authMiddleware, TestController.startTest);

testRouter.post('/:testId/answer', authMiddleware, TestController.submitAnswer);

testRouter.post('/:testId/finish', authMiddleware, TestController.finishTest);

export default testRouter;
