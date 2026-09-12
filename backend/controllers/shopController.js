const User = require('../models/User');

// Small, hand-picked catalog. Kept server-side so prices can't be spoofed.
const SHOP_ITEMS = [
  { id: 'theme-cyberpunk', name: 'Cyberpunk Theme', type: 'theme', cost: 500, emoji: '🌌' },
  { id: 'theme-forest', name: 'Forest Theme', type: 'theme', cost: 400, emoji: '🌲' },
  { id: 'theme-midnight', name: 'Midnight Theme', type: 'theme', cost: 600, emoji: '🌙' },
  { id: 'frame-warrior', name: 'Warrior Frame', type: 'frame', cost: 500, emoji: '⚔️' },
  { id: 'frame-golden', name: 'Golden Avatar Frame', type: 'frame', cost: 1500, emoji: '👑' },
  { id: 'badge-productivity', name: 'Productivity Master Badge', type: 'badge', cost: 1000, emoji: '⚡' },
];

async function listItems(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    const items = SHOP_ITEMS.map((item) => ({ ...item, owned: user.inventory.includes(item.id) }));
    res.json({ items, gold: user.gold });
  } catch (err) {
    next(err);
  }
}

async function purchaseItem(req, res, next) {
  try {
    const item = SHOP_ITEMS.find((i) => i.id === req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    const user = await User.findById(req.userId);
    if (user.inventory.includes(item.id)) {
      return res.status(409).json({ message: 'You already own this.' });
    }
    if (user.gold < item.cost) {
      return res.status(402).json({ message: 'Not enough gold.' });
    }

    user.gold -= item.cost;
    user.inventory.push(item.id);
    await user.save();

    res.json({ message: `${item.name} unlocked.`, character: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

async function equipItem(req, res, next) {
  try {
    const { itemId } = req.body;
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    const user = await User.findById(req.userId);

    if (!item || !user.inventory.includes(itemId)) {
      return res.status(400).json({ message: 'You do not own that item.' });
    }

    if (item.type === 'theme') user.equippedTheme = itemId;
    if (item.type === 'frame') user.equippedFrame = itemId;

    await user.save();
    res.json({ character: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { listItems, purchaseItem, equipItem, SHOP_ITEMS };
