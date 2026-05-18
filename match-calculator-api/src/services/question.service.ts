import Question from '../models/Question';

export const getAllQuestionsService = async () => {
  return Question.find().sort({ order: 1 }).select('-__v');
};
