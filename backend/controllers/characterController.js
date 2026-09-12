const User = require('../models/User');
const QuestLog = require('../models/QuestLog');
const { deriveProgress } = require('../utils/levelCurve');
const { computeBadges } = require('../utils/badges');
const { sendBadgeUnlockedEmail } = require('../services/emailService');

async function getCharacter(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const progress = deriveProgress(user.totalXp);
    const questCount = await QuestLog.countDocuments({ user: user._id });
    const badges = computeBadges(user.toObject(), questCount);
    const oldBadges = Array.isArray(user.badges) ? user.badges : [];

    if (badges.length !== oldBadges.length || badges.some((id) => !oldBadges.includes(id))) {
      const newlyUnlocked = badges.filter((id) => !oldBadges.includes(id));

      user.badges = badges;
      await user.save();

      try {
        await sendBadgeUnlockedEmail(user.toObject(), newlyUnlocked);
      } catch (err) {
        console.warn('[email] badge email failed:', err.message);
      }
    }

    res.json({ character: { ...user.toPublicJSON(), badges, ...progress } });
  } catch (err) {
    next(err);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const logs = await QuestLog.find({ user: req.userId, completedAt: { $gte: since } });

    const dayLabels = [];
    const xpByDay = {};
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      dayLabels.push(key);
      xpByDay[key] = 0;
    }

    const xpByAttribute = { intellect: 0, strength: 0, wisdom: 0, discipline: 0, charisma: 0, creativity: 0 };

    logs.forEach((log) => {
      const key = new Date(log.completedAt).toDateString();
      if (xpByDay[key] !== undefined) xpByDay[key] += log.xpEarned;
      if (xpByAttribute[log.attribute] !== undefined) xpByAttribute[log.attribute] += log.xpEarned;
    });

    res.json({
      weeklyXp: dayLabels.map((key) => ({ day: key, xp: xpByDay[key] })),
      attributeFocus: xpByAttribute,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCharacter, getAnalytics };
