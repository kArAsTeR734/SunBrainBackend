import { Router } from 'express';
import LeaderboardController from "../controllers/leaderboard-controller.js";
import {authMiddleware} from "../middleware/auth-middleware.js";

const leaderboardRouter = new Router();

leaderboardRouter.get('/', authMiddleware,LeaderboardController.getAllLeaderboard);

leaderboardRouter.get('/profile-leaderboard',authMiddleware, LeaderboardController.getProfileLeaderboard);

export default leaderboardRouter;