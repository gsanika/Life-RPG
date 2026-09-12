const nodemailer = require('nodemailer');
const { BADGE_CATALOG } = require('../utils/badges');

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user,
      pass,
    },
  });
}

async function sendMail({ to, subject, text, html }) {
  const transporter = buildTransporter();
  if (!transporter) {
    return { sent: false, skipped: true, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true, skipped: false, messageId: info.messageId };
  } catch (err) {
    return { sent: false, skipped: false, reason: err.message };
  }
}

async function sendWelcomeEmail(user) {
  const to = user.email;
  const subject = 'Welcome to Life RPG — your quest begins';
  const text = `Hi ${user.username},\n\nWelcome to Life RPG. Start your first quest and begin building your real-life legend.\n\nYour adventure starts now!`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Welcome to Life RPG, ${user.username}!</h2>
    <p>Your account has been created successfully.</p>
    <p>Start your first quest, build momentum, and earn XP, gold, and badges.</p>
    <p>Let’s begin your adventure.</p>
  </div>`;

  return sendMail({ to, subject, text, html });
}

async function sendBadgeUnlockedEmail(user, badgeIds) {
  if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
    return { sent: false, skipped: true, reason: 'NO_BADGES' };
  }

  const badges = badgeIds
    .map((id) => BADGE_CATALOG[id] || { id, label: id, icon: '🏅' })
    .map((badge) => `${badge.icon || '🏅'} ${badge.label || badge.id}`)
    .join(', ');

  const subject = 'You unlocked a new Life RPG badge';
  const text = `Hi ${user.username},\n\nYou unlocked a new badge: ${badges}.\n\nKeep going — your next achievement is waiting.`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Badge unlocked — ${user.username}!</h2>
    <p>You earned a new Life RPG badge:</p>
    <p><strong>${badges}</strong></p>
    <p>Keep building your streak, completing quests, and leveling up your character.</p>
  </div>`;

  return sendMail({ to: user.email, subject, text, html });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendBadgeUnlockedEmail,
};
