const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const QuestLog = require('../models/QuestLog');
const { deriveProgress } = require('../utils/levelCurve');
const { computeBadges } = require('../utils/badges');
const { sendWelcomeEmail, sendBadgeUnlockedEmail } = require('../services/emailService');

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function withProgress(user) {
  const progress = deriveProgress(user.totalXp);
  const questCount = await QuestLog.countDocuments({ user: user._id });
  const badges = computeBadges(user.toObject(), questCount);

  if (badges.length !== (user.badges || []).length || badges.some((id) => !(user.badges || []).includes(id))) {
    const oldBadges = Array.isArray(user.badges) ? user.badges : [];
    const newlyUnlocked = badges.filter((id) => !oldBadges.includes(id));

    user.badges = badges;
    await user.save();

    if (newlyUnlocked.length > 0) {
      try {
        await sendBadgeUnlockedEmail(user.toObject ? user.toObject() : user, newlyUnlocked);
      } catch (err) {
        console.warn('[email] badge email failed:', err.message);
      }
    }
  }

  return { ...user.toPublicJSON(), badges, ...progress };
}

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are all required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });

    const token = signToken(user._id);
    const publicUser = await withProgress(user);

    try {
      await sendWelcomeEmail({ username: user.username, email: user.email });
    } catch (err) {
      console.warn('[email] welcome email failed:', err.message);
    }

    res.status(201).json({ token, user: publicUser });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);
    const publicUser = await withProgress(user);
    res.json({ token, user: publicUser });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const publicUser = await withProgress(user);
    res.json({ user: publicUser });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
