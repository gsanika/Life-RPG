const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { listItems, purchaseItem, equipItem } = require('../controllers/shopController');

router.use(requireAuth);

router.get('/', listItems);
router.post('/:itemId/purchase', purchaseItem);
router.post('/equip', equipItem);

module.exports = router;
