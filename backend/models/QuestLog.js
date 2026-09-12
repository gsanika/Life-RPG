const mongoose = require('mongoose');

const questLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quest: { type: mongoose.Schema.Types.ObjectId, ref: 'Quest', required: true },
    questTitle: { type: String, required: true }, // snapshot in case the quest is later edited/deleted
    category: { type: String },
    attribute: { type: String },
    xpEarned: { type: Number, required: true },
    goldEarned: { type: Number, required: true },
    attributeGained: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

questLogSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('QuestLog', questLogSchema);
