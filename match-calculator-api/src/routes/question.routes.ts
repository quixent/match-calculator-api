import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { getQuestions } from '../controllers/question.controller';

const router = Router();

router.get('/', verifyToken, getQuestions);

export default router;
