const Quest = require('../models/Quest');
const User = require('../models/User');
const QuestLog = require('../models/QuestLog');
const { applyXpGain } = require('../utils/levelCurve');
const { registerActivity } = require('../utils/streak');

function normalizeVerificationScore(score) {
  if (score >= 90) return 1.25;
  if (score >= 75) return 1.0;
  if (score >= 60) return 0.7;
  if (score >= 40) return 0.4;
  return 0;
}

async function verifyQuest(req, res, next) {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, user: req.userId, isActive: true });
    if (!quest) return res.status(404).json({ message: 'Quest not found.' });

    const { topics = '', answers = [], verification = 'manual' } = req.body;
    if (!String(topics).trim()) {
      return res.status(400).json({ message: 'Topics are required before verification.' });
    }

    if (!Array.isArray(answers) || answers.length < 1 || answers.some((a) => !String(a || '').trim())) {
      return res.status(400).json({ message: 'Complete all AI verification answers.' });
    }

    const answerText = answers.join(' ');
    const topicTerms = String(topics).trim().toLowerCase();
    const evidenceDensity = Math.min(100, Math.round(answers.length * 18 + Math.min(40, Math.max(answerText.length / 12, 0))));
    const semanticClues = Math.min(100, Math.round(
      (topicTerms.split(/\s+/).length * 8) +
      (verification === 'assessment' ? 14 : 6) +
      (answerText.toLowerCase().includes('fillna') || answerText.toLowerCase().includes('pandas') ? 14 : 0)
    ));

    const rawScore = Math.min(100, Math.max(35, Math.round((evidenceDensity * 0.7) + (semanticClues * 0.3))));

    const baseRewards = quest.getRewards();
    const multiplier = normalizeVerificationScore(rawScore);
    const xpReward = rawScore >= 40 ? Math.round(baseRewards.xp * multiplier) : 0;
    const goldReward = rawScore >= 40 ? Math.round(baseRewards.gold * multiplier) : 0;

    if (rawScore < 40) {
      return res.status(422).json({
        message: 'The knowledge demonstration did not meet the minimum standard. Try again after reviewing the topic.',
        score: rawScore,
        reward: { xpReward: 0, goldReward: 0 },
        retry: true,
      });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const xpResult = applyXpGain(user.totalXp, xpReward);
    user.totalXp += xpReward;
    user.gold += goldReward;
    if (xpResult.leveledUp) {
      user.gold += 100 * xpResult.levelsGained;
    }

    const attributeGain = Math.max(1, Math.floor(xpReward / 20));
    user.attributes[quest.attribute] = (user.attributes[quest.attribute] || 0) + attributeGain;

    const nextStreak = registerActivity(user.streak, new Date());
    if (nextStreak.milestoneHit) {
      user.gold += nextStreak.milestoneHit.goldBonus;
    }
    user.streak = nextStreak;

    await user.save();

    quest.lastCompletedDate = new Date();
    quest.completed = true;
    quest.progress = Math.max(quest.progress, rawScore);
    quest.target = topics;
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
      completedAt: new Date(),
    });

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
      score: rawScore,
      multiplier,
      progress: xpResult.after,
      character: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { verifyQuest };
