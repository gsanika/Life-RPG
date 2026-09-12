const BADGE_CATALOG = {
  'first-quest': { id: 'first-quest', icon: '🌱', label: 'First Quest', description: 'Complete your first quest.' },
  'seven-day-streak': { id: 'seven-day-streak', icon: '🔥', label: '7 Day Streak', description: 'Maintain a 7-day streak.' },
  'thirty-day-streak': { id: 'thirty-day-streak', icon: '⚡', label: '30 Day Streak', description: 'Maintain a 30-day streak.' },
  'hundred-quests': { id: 'hundred-quests', icon: '☄️', label: '100 Quests', description: 'Complete 100 quests.' },
  'year-1': { id: 'year-1', icon: '🏆', label: '1 Year in Life RPG', description: 'Survive one full year in Life RPG.' },
  'year-2': { id: 'year-2', icon: '👑', label: '2 Years in Life RPG', description: 'Survive two full years in Life RPG.' },
  'year-3': { id: 'year-3', icon: '🌌', label: '3 Years in Life RPG', description: 'Survive three full years in Life RPG.' },
  'first-100-xp': { id: 'first-100-xp', icon: '✦', label: '100 XP', description: 'Earn your first 100 XP.' },
  'first-level': { id: 'first-level', icon: '⬆️', label: 'Level One', description: 'Reach level one.' },
};

function computeBadges(user, questCount = 0) {
  const badges = new Set(Array.isArray(user.badges) ? user.badges : []);

  if (questCount >= 1) badges.add('first-quest');
  if (questCount >= 100) badges.add('hundred-quests');

  if ((user.streak?.current || 0) >= 7) badges.add('seven-day-streak');
  if ((user.streak?.current || 0) >= 30) badges.add('thirty-day-streak');

  if ((user.totalXp || 0) >= 100) badges.add('first-100-xp');
  if ((user.totalXp || 0) >= 100 && !badges.has('first-level')) badges.add('first-level');

  const createdAt = user.createdAt ? new Date(user.createdAt) : null;
  if (createdAt) {
    const msInYear = 365.25 * 24 * 60 * 60 * 1000;
    const years = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / msInYear));
    if (years >= 1) badges.add('year-1');
    if (years >= 2) badges.add('year-2');
    if (years >= 3) badges.add('year-3');
  }

  return Array.from(badges);
}

module.exports = { BADGE_CATALOG, computeBadges };
