const mongoose = require('mongoose');

const ATTRIBUTE_KEYS = ['intellect', 'strength', 'wisdom', 'discipline', 'charisma', 'creativity'];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 24 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },

    totalXp: { type: Number, default: 0, min: 0 },
    gold: { type: Number, default: 0, min: 0 },

    attributes: {
      intellect: { type: Number, default: 0 },
      strength: { type: Number, default: 0 },
      wisdom: { type: Number, default: 0 },
      discipline: { type: Number, default: 0 },
      charisma: { type: Number, default: 0 },
      creativity: { type: Number, default: 0 },
    },

    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },

    inventory: [{ type: String }], // shop item ids owned
    equippedFrame: { type: String, default: 'default' },
    equippedTheme: { type: String, default: 'default' },
    badges: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    totalXp: this.totalXp,
    gold: this.gold,
    attributes: this.attributes,
    streak: this.streak,
    inventory: this.inventory,
    equippedFrame: this.equippedFrame,
    equippedTheme: this.equippedTheme,
    badges: Array.isArray(this.badges) ? this.badges : [],
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ATTRIBUTE_KEYS = ATTRIBUTE_KEYS;
