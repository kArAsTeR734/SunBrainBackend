import { Router } from 'express';
import TaskController from '../controllers/task-controller.js';

const taskRouter = new Router();

taskRouter.post(
  '/:taskId/check',
  TaskController.checkAnswer
);

export default taskRouter;