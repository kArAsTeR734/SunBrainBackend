import { Router } from 'express';
import TaskController from '../controllers/task-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const taskRouter = new Router();

taskRouter.post('/:taskId/check', authMiddleware, TaskController.checkAnswer);

taskRouter.get('/:topicId', authMiddleware, TaskController.getTaskList);

taskRouter.get('/:taskId', authMiddleware, TaskController.getTask);

export default taskRouter;
