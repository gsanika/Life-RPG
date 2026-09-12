const mongoose = require('mongoose');

const DIFFICULTY_REWARDS = {
  easy: { xp: 50, gold: 10 },
  medium: { xp: 100, gold: 20 },
  hard: { xp: 150, gold: 35 },
  epic: { xp: 250, gold: 60 },
};

const SCALE_MULTIPLIERS = {
  daily: 1,
  weekly: 2,
  epic: 3,
};

const questSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: '' },

    category: {
      type: String,
      enum: ['coding', 'fitness', 'reading', 'mindfulness', 'social', 'creative', 'custom'],
      default: 'custom',
    },
    attribute: {
      type: String,
      enum: ['intellect', 'strength', 'wisdom', 'discipline', 'charisma', 'creativity'],
      default: 'discipline',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'epic'],
      default: 'medium',
    },
    scale: {
      type: String,
      enum: ['daily', 'weekly', 'epic'],
      default: 'daily',
    },
    questType: {
      type: String,
      enum: ['learning', 'coding', 'reading', 'fitness', 'focus', 'skill', 'custom'],
      default: 'custom',
    },
    verification: {
      type: String,
      enum: ['manual', 'timer', 'assessment', 'workout', 'reading', 'coding'],
      default: 'manual',
    },
    target: { type: String, trim: true, default: '' },
    targetValue: { type: Number, default: 1, min: 1 },
    targetUnit: { type: String, trim: true, default: 'activity' },
    progress: { type: Number, default: 0, min: 0 },
    isBoss: { type: Boolean, default: false },
    bossName: { type: String, trim: true, maxlength: 80, default: '' },

    recurring: { type: Boolean, default: true }, // daily quest vs one-off
    isActive: { type: Boolean, default: true }, // soft-delete flag

    // One-off quests: mark done and never reset.
    // Recurring quests: track the last day they were completed instead.
    completed: { type: Boolean, default: false },
    lastCompletedDate: { type: Date, default: null },
  },
  { timestamps: true }
);

questSchema.methods.getRewards = function getRewards() {
  const base = DIFFICULTY_REWARDS[this.difficulty] || DIFFICULTY_REWARDS.medium;
  const multiplier = SCALE_MULTIPLIERS[this.scale] || SCALE_MULTIPLIERS.daily;
  return {
    xp: Math.round(base.xp * multiplier),
    gold: Math.round(base.gold * multiplier),
  };
};

module.exports = mongoose.model('Quest', questSchema);
module.exports.DIFFICULTY_REWARDS = DIFFICULTY_REWARDS;
module.exports.SCALE_MULTIPLIERS = SCALE_MULTIPLIERS;
