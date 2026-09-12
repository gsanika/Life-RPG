const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const {
  listQuests,
  createQuest,
  updateQuest,
  deleteQuest,
  completeQuest,
  getHistory,
} = require('../controllers/questController');
const { verifyQuest } = require('../controllers/aiQuestController');
const { beginVerification, answerVerification, finishVerification } = require('../controllers/verificationController');

router.use(requireAuth);

router.get('/', listQuests);
router.post('/', createQuest);
router.get('/history', getHistory);
router.patch('/:id', updateQuest);
router.delete('/:id', deleteQuest);
router.post('/:id/complete', completeQuest);
router.post('/:id/verify', verifyQuest);
router.post('/:id/ai/verify/start', beginVerification);
router.post('/:id/ai/verify/answer', answerVerification);
router.post('/:id/ai/verify/finish', finishVerification);

module.exports = router;
