import mongoose from 'mongoose';
import Match from '../models/Match';
import Answer from '../models/Answer';
import ConnectCode from '../models/ConnectCode';
import Question from '../models/Question';
import { ScoreResult } from '../types';

const CODE_EXPIRY_MS = 24 * 60 * 60 * 1000;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const generateConnectCodeService = async (userId: string) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

  const connectCode = await ConnectCode.findOneAndUpdate(
    { userId },
    { userId, code, expiresAt },
    { upsert: true, new: true },
  );
  return connectCode;
};

export const getMyConnectCodeService = async (userId: string) => {
  const connectCode = await ConnectCode.findOne({ userId });
  if (!connectCode) {
    throw { status: 404, message: 'No connect code found. Generate one first.', error: 'CODE_NOT_FOUND' };
  }
  return connectCode;
};

export const sendMatchRequestService = async (senderId: string, code: string) => {
  const connectCode = await ConnectCode.findOne({ code });
  if (!connectCode) {
    throw { status: 404, message: 'Invalid or expired connect code.', error: 'INVALID_CODE' };
  }

  const receiverId = connectCode.userId;

  if (receiverId === senderId) {
    throw { status: 400, message: 'You cannot match with yourself.', error: 'INVALID_REQUEST' };
  }

  const existing = await Match.findOne({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  });

  if (existing) {
    throw { status: 409, message: 'Match request already exists.', error: 'MATCH_EXISTS' };
  }

  const match = await Match.create({ senderId, receiverId });
  return match;
};

export const getMyMatchesService = async (userId: string) => {
  return Match.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).sort({ createdAt: -1 });
};

export const getMatchByIdService = async (matchId: string, userId: string) => {
  const match = await Match.findById(matchId);
  if (!match) {
    throw { status: 404, message: 'Match not found.', error: 'MATCH_NOT_FOUND' };
  }
  if (match.senderId !== userId && match.receiverId !== userId) {
    throw { status: 403, message: 'Access denied.', error: 'UNAUTHORIZED' };
  }
  return match;
};

export const respondToMatchService = async (
  matchId: string,
  userId: string,
  action: 'accepted' | 'rejected',
) => {
  const match = await Match.findById(matchId);
  if (!match) {
    throw { status: 404, message: 'Match not found.', error: 'MATCH_NOT_FOUND' };
  }
  if (match.receiverId !== userId) {
    throw { status: 403, message: 'Only the receiver can respond to this match.', error: 'UNAUTHORIZED' };
  }
  if (match.status !== 'requested') {
    throw { status: 400, message: `Match is already ${match.status}.`, error: 'INVALID_STATUS' };
  }

  match.status = action;
  await match.save();
  return match;
};

export const submitAnswersService = async (
  matchId: string,
  userId: string,
  answers: { questionId: string; optionId: string }[],
) => {
  const match = await Match.findById(matchId);
  if (!match) {
    throw { status: 404, message: 'Match not found.', error: 'MATCH_NOT_FOUND' };
  }
  if (match.senderId !== userId && match.receiverId !== userId) {
    throw { status: 403, message: 'Access denied.', error: 'UNAUTHORIZED' };
  }
  if (match.status !== 'accepted') {
    throw { status: 400, message: 'Match must be accepted before answering.', error: 'INVALID_STATUS' };
  }

  const ops = answers.map(({ questionId, optionId }) => ({
    updateOne: {
      filter: { matchId: new mongoose.Types.ObjectId(matchId), userId, questionId: new mongoose.Types.ObjectId(questionId) },
      update: { matchId, userId, questionId, optionId },
      upsert: true,
    },
  }));

  await Answer.bulkWrite(ops);

  // check if both users answered all questions → mark complete + calculate score
  const questions = await Question.find();
  const totalQuestions = questions.length;

  const senderAnswers = await Answer.countDocuments({ matchId, userId: match.senderId });
  const receiverAnswers = await Answer.countDocuments({ matchId, userId: match.receiverId });

  if (senderAnswers >= totalQuestions && receiverAnswers >= totalQuestions) {
    const score = await calculateCompatibilityScore(matchId, match.senderId, match.receiverId);
    match.status = 'complete';
    match.compatibilityScore = score.compatibility;
    await match.save();
  }

  return { message: 'Answers submitted successfully' };
};

export const getScoreService = async (matchId: string, userId: string): Promise<ScoreResult> => {
  const match = await Match.findById(matchId);
  if (!match) {
    throw { status: 404, message: 'Match not found.', error: 'MATCH_NOT_FOUND' };
  }
  if (match.senderId !== userId && match.receiverId !== userId) {
    throw { status: 403, message: 'Access denied.', error: 'UNAUTHORIZED' };
  }
  if (match.status !== 'complete') {
    throw { status: 400, message: 'Score is only available after both users answer all questions.', error: 'NOT_COMPLETE' };
  }

  const partnerId = match.senderId === userId ? match.receiverId : match.senderId;
  return calculateCompatibilityScore(matchId, userId, partnerId);
};

async function calculateCompatibilityScore(
  matchId: string,
  userAId: string,
  userBId: string,
): Promise<ScoreResult> {
  const questions = await Question.find().sort({ order: 1 });

  const userAAnswers = await Answer.find({ matchId, userId: userAId });
  const userBAnswers = await Answer.find({ matchId, userId: userBId });

  const userAMap = new Map(userAAnswers.map((a) => [a.questionId.toString(), a.optionId.toString()]));
  const userBMap = new Map(userBAnswers.map((a) => [a.questionId.toString(), a.optionId.toString()]));

  let totalPoints = 0;
  let earnedPoints = 0;
  const breakdown: ScoreResult['breakdown'] = [];

  for (const question of questions) {
    const maxWeight = Math.max(...question.options.map((o) => o.weight));
    totalPoints += maxWeight;

    const aOptId = userAMap.get(question._id.toString());
    const bOptId = userBMap.get(question._id.toString());

    const aOpt = question.options.find((o) => o._id.toString() === aOptId);
    const bOpt = question.options.find((o) => o._id.toString() === bOptId);

    const points = aOpt && bOpt && aOptId === bOptId ? aOpt.weight : 0;
    earnedPoints += points;

    breakdown.push({
      questionId: question._id.toString(),
      questionText: question.text,
      yourOption: aOpt?.text ?? 'Not answered',
      partnerOption: bOpt?.text ?? 'Not answered',
      points,
    });
  }

  const compatibility = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return {
    compatibility,
    totalQuestions: questions.length,
    answeredByYou: userAAnswers.length,
    answeredByPartner: userBAnswers.length,
    breakdown,
  };
}
