import { Router } from 'express';
import TestController from '../controllers/test-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const testRouter = new Router();

testRouter.get(
  '/subjects/:subjectCode/pool-meta',
  authMiddleware,
  TestController.getPoolMeta
);

testRouter.get('/:testId/counts', authMiddleware, TestController.getTestCounts);
testRouter.get('/:testId/review', authMiddleware, TestController.getReview);

testRouter.post('/start', authMiddleware, TestController.startTest);

testRouter.post('/:testId/answer', authMiddleware, TestController.submitAnswer);

testRouter.post(
  '/:testId/generate-homeworks',
  authMiddleware,
  TestController.generateHomeworks
);

testRouter.post('/:testId/finish', authMiddleware, TestController.finishTest);

export default testRouter;
