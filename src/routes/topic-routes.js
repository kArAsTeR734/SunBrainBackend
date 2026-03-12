import { Router } from 'express';
import TopicController from '../controllers/topic-controller.js';

const topicRouter = new Router();

topicRouter.get(
  '/:subjectId',
  TopicController.getTopics
);

export default topicRouter;