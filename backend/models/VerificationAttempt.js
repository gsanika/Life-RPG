const mongoose = require('mongoose');

const verificationAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quest', required: true, index: true },
    topics: { type: String, required: true, trim: true },
    questions: [{
      question: { type: String, required: true },
      answer: { type: String, default: '' },
      difficulty: { type: String, default: 'medium' },
      type: { type: String, default: 'concept' },
      isCorrect: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      nextDifficulty: { type: String, default: 'medium' },
    }],
    individualScores: [{ type: Number }],
    overallScore: { type: Number, default: 0 },
    topicScores: { type: Map, of: Number, default: {} },
    understandingLevel: { type: String, default: 'unverified' },
    verified: { type: Boolean, default: false },
    feedback: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    completedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('VerificationAttempt', verificationAttemptSchema);
