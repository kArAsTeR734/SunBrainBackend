import {Router} from 'express';
import HomeworkController from "../controllers/homework-controller.js";
import {authMiddleware} from "../middleware/auth-middleware.js";

const homeworkRouter = new Router();

homeworkRouter.get('/my',authMiddleware, HomeworkController.getMyHomeworks);
homeworkRouter.post('/tasks/:taskId/check', authMiddleware, HomeworkController.checkTaskAnswer);

homeworkRouter.get('/:id',authMiddleware, HomeworkController.getHomework);

export default homeworkRouter;
