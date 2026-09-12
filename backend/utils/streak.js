/**
 * Consistency Engine: tracks daily activity streaks.
 * Dates are compared at day granularity (local server day) so a user only
 * needs one completed quest per calendar day to keep their streak alive.
 */

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a, b) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((startOfDay(a) - startOfDay(b)) / MS_PER_DAY);
}

/**
 * Given the user's current streak state and "now", return the updated
 * streak after a quest completion.
 */
function registerActivity(streak, now = new Date()) {
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const lastActiveDate = streak?.lastActiveDate || null;

  if (!lastActiveDate) {
    const next = { current: 1, longest: Math.max(1, longest), lastActiveDate: now };
    return { ...next, milestoneHit: getMilestone(1) };
  }

  const gap = daysBetween(now, lastActiveDate);

  let nextCurrent;
  if (gap === 0) {
    nextCurrent = current; // already logged activity today, no change
  } else if (gap === 1) {
    nextCurrent = current + 1; // consecutive day
  } else {
    nextCurrent = 1; // streak broken, restart
  }

  const nextLongest = Math.max(longest, nextCurrent);

  return {
    current: nextCurrent,
    longest: nextLongest,
    lastActiveDate: now,
    milestoneHit: gap === 0 ? null : getMilestone(nextCurrent),
  };
}

const MILESTONES = {
  3: { label: '3-Day Spark', goldBonus: 50 },
  7: { label: '7-Day Warrior', goldBonus: 150, badge: '7-Day Warrior' },
  14: { label: '14-Day Vanguard', goldBonus: 350, badge: 'Rare Theme Unlock' },
  30: { label: '30-Day Legend', goldBonus: 1000, badge: 'Legendary Badge' },
};

function getMilestone(streakCount) {
  return MILESTONES[streakCount] || null;
}

module.exports = { registerActivity, getMilestone, daysBetween };
