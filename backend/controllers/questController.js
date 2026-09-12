const Quest = require('../models/Quest');
const QuestLog = require('../models/QuestLog');
const User = require('../models/User');
const { applyXpGain } = require('../utils/levelCurve');
const { registerActivity } = require('../utils/streak');
const { computeBadges } = require('../utils/badges');
const { sendBadgeUnlockedEmail } = require('../services/emailService');

function isSameDay(a, b) {
  if (!a || !b) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.toDateString() === d2.toDateString();
}

async function listQuests(req, res, next) {
  try {
    const quests = await Quest.find({ user: req.userId, isActive: true }).sort({ createdAt: -1 });

    // For recurring quests, "completed today" is derived, not stored as a flag.
    const withStatus = quests.map((q) => {
      const completedToday = q.recurring
        ? isSameDay(q.lastCompletedDate, new Date())
        : q.completed;
      return { ...q.toObject(), completedToday };
    });

    res.json({ quests: withStatus });
  } catch (err) {
    next(err);
  }
}

async function createQuest(req, res, next) {
  try {
    const {
      title,
      description,
      category,
      attribute,
      difficulty,
      scale,
      questType,
      verification,
      target,
      targetValue,
      targetUnit,
      recurring,
      isBoss,
      bossName,
    } = req.body;
    if (!title) return res.status(400).json({ message: 'A quest needs a title.' });

    const quest = await Quest.create({
      user: req.userId,
      title,
      description,
      category,
      attribute,
      difficulty,
      scale: scale || 'daily',
      questType: questType || 'custom',
      verification: verification || 'manual',
      target: target || '',
      targetValue: Number(targetValue) || 1,
      targetUnit: targetUnit || 'activity',
      isBoss: Boolean(isBoss),
      bossName: bossName || '',
      recurring: recurring !== false,
    });

    res.status(201).json({ quest });
  } catch (err) {
    next(err);
  }
}

async function updateQuest(req, res, next) {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, user: req.userId });
    if (!quest) return res.status(404).json({ message: 'Quest not found.' });

    const editable = [
      'title', 'description', 'category', 'attribute', 'difficulty', 'scale', 'recurring', 'isBoss', 'bossName',
      'questType', 'verification', 'target', 'targetValue', 'targetUnit', 'progress'
    ];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) quest[field] = req.body[field];
    });

    await quest.save();
    res.json({ quest });
  } catch (err) {
    next(err);
  }
}

async function deleteQuest(req, res, next) {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, user: req.userId });
    if (!quest) return res.status(404).json({ message: 'Quest not found.' });

    quest.isActive = false;
    await quest.save();
    res.json({ message: 'Quest retired.' });
  } catch (err) {
    next(err);
  }
}

/**
 * THE core endpoint. The client only ever says "I completed quest X" —
 * every reward number is computed here, server-side, so nothing in the
 * request body can be used to fabricate XP, gold or attributes.
 */
async function completeQuest(req, res, next) {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, user: req.userId, isActive: true });
    if (!quest) return res.status(404).json({ message: 'Quest not found.' });

    const now = new Date();

    if (quest.recurring) {
      if (isSameDay(quest.lastCompletedDate, now)) {
        return res.status(409).json({ message: 'This quest is already done for today.' });
      }
    } else if (quest.completed) {
      return res.status(409).json({ message: 'This quest has already been completed.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const { xp: xpReward, gold: goldReward } = quest.getRewards();
    const attributeGain = Math.max(1, Math.floor(xpReward / 20));

    // --- Progression Engine ---
    const xpResult = applyXpGain(user.totalXp, xpReward);
    user.totalXp += xpReward;

    // --- Economy Engine ---
    user.gold += goldReward;
    if (xpResult.leveledUp) {
      user.gold += 100 * xpResult.levelsGained; // level-up gold bonus
    }

    // --- Character attributes ---
    user.attributes[quest.attribute] = (user.attributes[quest.attribute] || 0) + attributeGain;

    // --- Consistency Engine ---
    const nextStreak = registerActivity(user.streak, now);
    if (nextStreak.milestoneHit) {
      user.gold += nextStreak.milestoneHit.goldBonus;
    }
    user.streak = nextStreak;

    await user.save();

    // --- Mark quest done + write history ---
    if (quest.recurring) {
      quest.lastCompletedDate = now;
    } else {
      quest.completed = true;
    }
    await quest.save();

    await QuestLog.create({
      user: user._id,
      quest: quest._id,
      questTitle: quest.title,
      category: quest.category,
      attribute: quest.attribute,
      xpEarned: xpReward,
      goldEarned: goldReward,
      attributeGained: attributeGain,
      completedAt: now,
    });

    const questCount = await QuestLog.countDocuments({ user: user._id });
    const badges = computeBadges(user.toObject(), questCount);
    const oldBadges = Array.isArray(user.badges) ? user.badges : [];
    const newlyUnlocked = badges.filter((id) => !oldBadges.includes(id));

    if (newlyUnlocked.length > 0) {
      user.badges = badges;
      await user.save();

      try {
        await sendBadgeUnlockedEmail(user.toObject(), newlyUnlocked);
      } catch (err) {
        console.warn('[email] badge email failed:', err.message);
      }
    } else if (badges.length !== oldBadges.length || badges.some((id) => !oldBadges.includes(id))) {
      user.badges = badges;
      await user.save();
    }

    res.json({
      reward: {
        xpEarned: xpReward,
        goldEarned: goldReward,
        attribute: quest.attribute,
        attributeGained: attributeGain,
        leveledUp: xpResult.leveledUp,
        levelsGained: xpResult.levelsGained,
        levelUpGoldBonus: xpResult.leveledUp ? 100 * xpResult.levelsGained : 0,
        streakMilestone: nextStreak.milestoneHit,
      },
      progress: xpResult.after,
      character: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const logs = await QuestLog.find({ user: req.userId }).sort({ completedAt: -1 }).limit(limit);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

module.exports = { listQuests, createQuest, updateQuest, deleteQuest, completeQuest, getHistory };
