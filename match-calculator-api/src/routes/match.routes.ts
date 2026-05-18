import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import {
  generateConnectCode,
  getMyConnectCode,
  sendMatchRequest,
  getMyMatches,
  getMatchById,
  acceptMatch,
  rejectMatch,
  submitAnswers,
  getScore,
} from '../controllers/match.controller';

const router = Router();

router.post('/connect-code/generate', verifyToken, generateConnectCode);
router.get('/connect-code/my', verifyToken, getMyConnectCode);

router.post('/request', verifyToken, sendMatchRequest);
router.get('/', verifyToken, getMyMatches);
router.get('/:id', verifyToken, getMatchById);
router.put('/:id/accept', verifyToken, acceptMatch);
router.put('/:id/reject', verifyToken, rejectMatch);
router.post('/:id/answers', verifyToken, submitAnswers);
router.get('/:id/score', verifyToken, getScore);

export default router;
