import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { sendSuccess, sendError } from '../utils/apiResponse';
import {
  generateConnectCodeService,
  getMyConnectCodeService,
  sendMatchRequestService,
  getMyMatchesService,
  getMatchByIdService,
  respondToMatchService,
  submitAnswersService,
  getScoreService,
} from '../services/match.service';

export const generateConnectCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const connectCode = await generateConnectCodeService(req.user!.userId);
    sendSuccess(res, 'Connect code generated', { connectCode });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to generate code', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};

export const getMyConnectCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const connectCode = await getMyConnectCodeService(req.user!.userId);
    sendSuccess(res, 'Connect code fetched', { connectCode });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to fetch code', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};

export const sendMatchRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) {
      sendError(res, 'Connect code is required', 'INVALID_INPUT', 400);
      return;
    }
    const match = await sendMatchRequestService(req.user!.userId, code);
    sendSuccess(res, 'Match request sent', { match }, 201);
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to send match request', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};

export const getMyMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await getMyMatchesService(req.user!.userId);
    sendSuccess(res, 'Matches fetched', { matches });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to fetch matches', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};

export const getMatchById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const match = await getMatchByIdService(req.params.id, req.user!.userId);
    sendSuccess(res, 'Match fetched', { match });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to fetch match', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};

export const acceptMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const match = await respondToMatchService(req.params.id, req.user!.userId, 'accepted');
    sendSuccess(res, 'Match accepted', { match });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to accept match', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};

export const rejectMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const match = await respondToMatchService(req.params.id, req.user!.userId, 'rejected');
    sendSuccess(res, 'Match rejected', { match });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to reject match', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};

export const submitAnswers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      sendError(res, 'answers array is required', 'INVALID_INPUT', 400);
      return;
    }
    const result = await submitAnswersService(req.params.id, req.user!.userId, answers);
    sendSuccess(res, result.message, {});
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to submit answers', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};

export const getScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const score = await getScoreService(req.params.id, req.user!.userId);
    sendSuccess(res, 'Score fetched', { score });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to fetch score', err.error ?? 'SERVER_ERROR', err.status ?? 500);
  }
};
