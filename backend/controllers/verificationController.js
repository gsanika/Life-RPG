const Quest = require('../models/Quest');
const User = require('../models/User');
const VerificationAttempt = require('../models/VerificationAttempt');
const { generateQuestions, evaluateAnswer, generateFinalAssessment } = require('../services/aiService');
const { applyXpGain } = require('../utils/levelCurve');
const { registerActivity } = require('../utils/streak');

function normalizeScore(score) {
  if (score >= 90) return { multiplier: 1.25, xpMultiplier: 1.25, goldMultiplier: 1.25, bonus: true };
  if (score >= 75) return { multiplier: 1.0, xpMultiplier: 1.0, goldMultiplier: 1.0, bonus: false };
  if (score >= 60) return { multiplier: 0.75, xpMultiplier: 0.75, goldMultiplier: 0.75, bonus: false };
  if (score >= 40) return { multiplier: 0.5, xpMultiplier: 0.5, goldMultiplier: 0.5, bonus: false };
  return { multiplier: 0, xpMultiplier: 0, goldMultiplier: 0, bonus: false };
}

async function beginVerification(req, res, next) {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, user: req.userId, isActive: true });
    if (!quest) return res.status(404).json({ message: 'Quest not found.' });

    if (quest.recurring && quest.lastCompletedDate && new Date(quest.lastCompletedDate).toDateString() === new Date().toDateString()) {
      return res.status(409).json({ message: 'This quest is already verified for today.' });
    }

    const topics = String(req.body.topics || '').trim();
    if (!topics) return res.status(400).json({ message: 'Tell the AI what topics or concepts you worked on.' });

    const questPlan = await generateQuestions({
      title: quest.title,
      category: quest.category,
      difficulty: quest.difficulty,
      verification: quest.verification,
      topics,
    });

    const attempt = await VerificationAttempt.create({
      userId: req.userId,
      questId: quest._id,
      topics,
      questions: questPlan.questions.map((q) => ({
        question: q.question,
        difficulty: q.difficulty,
        type: q.type,
      })),
      individualScores: [],
      overallScore: 0,
      topicScores: {},
      understandingLevel: 'pending',
      verified: false,
      feedback: '',
      strengths: [],
      weaknesses: [],
      createdAt: new Date(),
    });

    res.json({ attemptId: attempt._id, questions: questPlan.questions, questionCount: questPlan.questionCount, reasoning: questPlan.reasoning });
  } catch (err) {
    next(err);
  }
}

async function answerVerification(req, res, next) {
  try {
    const attemptId = req.body.attemptId || req.params.id;
    const attempt = await VerificationAttempt.findOne({ _id: attemptId, userId: req.userId });
    if (!attempt) return res.status(404).json({ message: 'Verification attempt not found.' });

    const { questionIndex, answer } = req.body;
    if (!String(answer || '').trim()) return res.status(400).json({ message: 'An answer is required.' });

    const index = Number(questionIndex);
    if (!Number.isInteger(index) || index < 0 || index >= attempt.questions.length) {
      return res.status(400).json({ message: 'Question not found.' });
    }

    const question = attempt.questions[index];
    if (!question) return res.status(400).json({ message: 'Question not found.' });

    const quest = await Quest.findById(attempt.questId);
    const topics = attempt.topics;

    const evaluation = await evaluateAnswer({
      question: question.question,
      answer,
      topics,
      difficulty: question.difficulty,
      context: quest.title,
    });

    if (!evaluation || typeof evaluation.score !== 'number' || typeof evaluation.is_correct !== 'boolean') {
      return res.status(502).json({ message: 'Malformed AI assessment response.' });
    }

    question.answer = String(answer);
    question.score = evaluation.score;
    question.isCorrect = Boolean(evaluation.is_correct);
    question.feedback = evaluation.feedback;
    question.strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths : [];
    question.weaknesses = Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [];
    question.nextDifficulty = evaluation.next_difficulty || question.difficulty;

    attempt.individualScores.push(evaluation.score);
    await attempt.save();

    res.json({
      question,
      evaluation,
      questionIndex: index,
      assessmentComplete: attempt.questions.length <= index + 1,
    });
  } catch (err) {
    next(err);
  }
}

async function finishVerification(req, res, next) {
  try {
    const attemptId = req.body.attemptId || req.params.id;
    const attempt = await VerificationAttempt.findOne({ _id: attemptId, userId: req.userId });
    if (!attempt) return res.status(404).json({ message: 'Verification attempt not found.' });

    const quest = await Quest.findOne({ _id: attempt.questId, user: req.userId, isActive: true });
    if (!quest) return res.status(404).json({ message: 'Quest not found.' });

    const questionResults = attempt.questions.map((q) => ({
      question: q.question,
      answer: q.answer,
      score: q.score,
      isCorrect: q.isCorrect,
      feedback: q.feedback,
      strengths: q.strengths,
      weaknesses: q.weaknesses,
      difficulty: q.difficulty,
    }));

    const finalAssessment = await generateFinalAssessment({
      title: quest.title,
      topics: attempt.topics,
      questionResults,
    });

    if (!finalAssessment || typeof finalAssessment.overall_score !== 'number' || typeof finalAssessment.verified !== 'boolean') {
      return res.status(502).json({ message: 'Malformed AI final assessment response.' });
    }

    const overallScore = Math.min(100, Math.max(0, Number(finalAssessment.overall_score)));
    const topicScores = Object.entries(finalAssessment.topic_scores || {}).reduce((acc, [key, value]) => {
      acc[key] = Math.min(100, Math.max(0, Number(value)));
      return acc;
    }, {});

    const normalized = normalizeScore(overallScore);
    const baseRewards = quest.getRewards();
    const xpReward = overallScore >= 40 ? Math.round(baseRewards.xp * normalized.multiplier) : 0;
    const goldReward = overallScore >= 40 ? Math.round(baseRewards.gold * normalized.multiplier) : 0;

    if (overallScore < 40) {
      attempt.overallScore = overallScore;
      attempt.topicScores = topicScores;
      attempt.understandingLevel = finalAssessment.understanding_level || 'limited';
      attempt.verified = false;
      attempt.feedback = finalAssessment.feedback || 'Assessment incomplete.';
      attempt.strengths = Array.isArray(finalAssessment.strengths) ? finalAssessment.strengths : [];
      attempt.weaknesses = Array.isArray(finalAssessment.weaknesses) ? finalAssessment.weaknesses : [];
      attempt.completedAt = new Date();
      await attempt.save();

      return res.status(422).json({
        message: 'The knowledge demonstration did not reach the verification threshold.',
        attempt,
        score: overallScore,
        reward: { xpReward: 0, goldReward: 0 },
        verified: false,
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
    quest.progress = Math.max(quest.progress, overallScore);
    quest.target = attempt.topics;
    await quest.save();

    await VerificationAttempt.updateOne(
      { _id: attempt._id },
      {
        $set: {
          overallScore,
          topicScores,
          understandingLevel: finalAssessment.understanding_level || 'strong',
          verified: true,
          feedback: finalAssessment.feedback || '',
          strengths: Array.isArray(finalAssessment.strengths) ? finalAssessment.strengths : [],
          weaknesses: Array.isArray(finalAssessment.weaknesses) ? finalAssessment.weaknesses : [],
          completedAt: new Date(),
        },
      }
    );

    const updatedAttempt = await VerificationAttempt.findById(attempt._id);

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
      score: overallScore,
      attempt: updatedAttempt,
      progress: xpResult.after,
      character: user.toPublicJSON(),
      topicScores,
      feedback: finalAssessment.feedback,
      verified: true,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { beginVerification, answerVerification, finishVerification };
