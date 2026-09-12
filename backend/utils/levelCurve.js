/**
 * Progression math for the Progression Engine.
 *
 * Levels get harder to reach as you go up (non-linear curve), so early
 * quests feel fast and rewarding while long-term growth still means something.
 *
 * totalXpForLevel(n) = cumulative XP required to REACH level n.
 *   n=1 -> 0
 *   n=2 -> 100
 *   n=3 -> 283
 *   n=5 -> 894
 *   n=10 -> 3162
 *   n=20 -> 8944
 */

const BASE_XP = 100;
const CURVE_EXPONENT = 1.5;

function totalXpForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(BASE_XP * Math.pow(level - 1, CURVE_EXPONENT) + BASE_XP * (level - 1));
}

/**
 * Given a total lifetime XP value, derive level, xp into current level,
 * and xp required for the next level.
 */
function deriveProgress(totalXp) {
  let level = 1;

  // Walk up until the next level would cost more XP than the player has.
  // Levels realistically won't exceed a few hundred, so a simple loop is fine.
  while (totalXpForLevel(level + 1) <= totalXp) {
    level += 1;
  }

  const currentLevelFloor = totalXpForLevel(level);
  const nextLevelCeiling = totalXpForLevel(level + 1);

  return {
    level,
    xpIntoLevel: totalXp - currentLevelFloor,
    xpForNextLevel: nextLevelCeiling - currentLevelFloor,
    totalXp,
  };
}

/**
 * Apply an XP gain to a user's existing total XP and report whether
 * they leveled up (and how many times, for double/triple level-ups).
 */
function applyXpGain(previousTotalXp, xpGained) {
  const before = deriveProgress(previousTotalXp);
  const after = deriveProgress(previousTotalXp + xpGained);

  return {
    before,
    after,
    leveledUp: after.level > before.level,
    levelsGained: after.level - before.level,
  };
}

module.exports = { totalXpForLevel, deriveProgress, applyXpGain };
