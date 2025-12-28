import {Router} from 'express';
import UserController from "../../controllers/user-controller.js";

const userRouter = new Router();

userRouter.get('/users', UserController.getUsers)

export default userRouter;