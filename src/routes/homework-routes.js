import {Router} from 'express';
import HomeworkController from "../controllers/homework-controller.js";
import {authMiddleware} from "../middleware/auth-middleware.js";

const homeworkRouter = new Router();

homeworkRouter.get('/my',authMiddleware, HomeworkController.getMyHomeworks);

homeworkRouter.get('/:id',authMiddleware, HomeworkController.getHomework);

export default homeworkRouter;