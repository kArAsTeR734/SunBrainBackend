import TestService from '../services/test-service.js';
import { errorResponse, successResponse } from '../utils/ApiError.js';

class TestController {
  static async getPoolMeta(req, res) {
    try {
      const { subjectCode } = req.params;
      const data = await TestService.getPoolMeta(subjectCode);

      return res.status(200).json(successResponse(data));
    } catch (error) {
      const status =
        error.message === 'subjectCode is required' ||
        error.message === 'subjectCode is not supported'
          ? 400
          : error.message === 'Subject not found'
            ? 404
            : 500;

      return res.status(status).json(errorResponse(error.message));
    }
  }

  static async getTestCounts(req, res) {
    try {
      const userId = req.userId;
      const { testId } = req.params;
      const data = await TestService.getTestCounts(testId, userId);

      return res.status(200).json(successResponse(data));
    } catch (error) {
      const status = error.message === 'Test not found' ? 404 : 500;
      return res.status(status).json(errorResponse(error.message));
    }
  }

  static async startTest(req, res) {
    try {
      const userId = req.userId;
      const { subjectCode } = req.body;

      const data = await TestService.startTest(userId, subjectCode);

      return res.status(201).json(successResponse(data));
    } catch (error) {
      let status = 500;

      if (
        error.message === 'User is not authenticated' ||
        error.message === 'subjectCode is required' ||
        error.message === 'subjectCode is not supported' ||
        error.message?.includes('No tasks found for task number') ||
        error.message?.includes('Cannot build test with target')
      ) {
        status = 400;
      } else if (error.message === 'Subject not found') {
        status = 404;
      }

      return res.status(status).json(errorResponse(error.message));
    }
  }

  static async submitAnswer(req, res) {
    try {
      const userId = req.userId;
      const { testId } = req.params;
      const { taskId, answer } = req.body;

      const data = await TestService.submitAnswer({
        userId,
        testId,
        taskId,
        answer
      });

      return res.status(200).json(successResponse(data));
    } catch (error) {
      let status = 500;

      if (
        error.message === 'User is not authenticated' ||
        error.message === 'Answer is required'
      ) {
        status = 400;
      } else if (
        error.message === 'Test not found' ||
        error.message === 'Task is not included in this test'
      ) {
        status = 404;
      }

      return res.status(status).json(errorResponse(error.message));
    }
  }

  static async finishTest(req, res) {
    try {
      const userId = req.userId;
      const { testId } = req.params;

      const data = await TestService.finishTest(testId, userId);

      return res.status(200).json(successResponse(data));
    } catch (error) {
      const status = error.message === 'Test not found' ? 404 : 500;
      return res.status(status).json(errorResponse(error.message));
    }
  }
}

export default TestController;
