import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { getAllQuestionsService } from '../services/question.service';

export const getQuestions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const questions = await getAllQuestionsService();
    sendSuccess(res, 'Questions fetched', { questions });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to fetch questions', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};
