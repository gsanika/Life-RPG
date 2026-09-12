const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { getCharacter, getAnalytics } = require('../controllers/characterController');

router.use(requireAuth);

router.get('/', getCharacter);
router.get('/analytics', getAnalytics);

module.exports = router;
