import { errorResponse, successResponse } from '../utils/ApiError.js';
import aiService from '../services/AIService.js';
import AIHomeworkService from '../services/ai-homework-service.js';

export class AIController {
  static async chat(req, res) {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json(errorResponse('messages are required'));
      }

      const content = await aiService.chat(messages);

      return res.status(200).json(successResponse(content));
    } catch (error) {
      return res.status(500).json(
        errorResponse(`Failed to call LLM: ${error?.message ?? 'Unknown error'}`)
      );
    }
  }

  static async generateHomework(req, res) {
    try {
      const userId = req.userId;
      const { subjectId, taskNumber } = req.body;

      const data = await AIHomeworkService.createForTask({
        userId,
        subjectId,
        taskNumber
      });

      return res.status(201).json(successResponse(data));
    } catch (error) {
      const status =
        error.message?.includes('must be a positive integer') ||
        error.message === 'Subject not found' ||
        error.message?.includes('Topic for task number')
          ? 400
          : 500;

      return res.status(status).json(errorResponse(error.message));
    }
  }
}
