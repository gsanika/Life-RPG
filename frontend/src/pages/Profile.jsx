import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import ContributionHeatmap from '../components/ContributionHeatmap.jsx';

const ATTRIBUTE_META = [
  { key: 'intellect', icon: '🧠', label: 'Intellect', color: 'var(--violet)' },
  { key: 'strength', icon: '💪', label: 'Strength', color: 'var(--ember)' },
  { key: 'wisdom', icon: '📖', label: 'Wisdom', color: 'var(--emerald)' },
  { key: 'discipline', icon: '🧘', label: 'Discipline', color: 'var(--teal)' },
  { key: 'charisma', icon: '🗣️', label: 'Charisma', color: 'var(--rose)' },
  { key: 'creativity', icon: '⚙️', label: 'Creativity', color: 'var(--gold)' },
];

const BADGE_CATALOG = {
  'first-quest': { icon: '🌱', label: 'First Quest', description: 'Complete your first quest.' },
  'seven-day-streak': { icon: '🔥', label: '7 Day Streak', description: 'Maintain a 7-day streak.' },
  'thirty-day-streak': { icon: '⚡', label: '30 Day Streak', description: 'Maintain a 30-day streak.' },
  'hundred-quests': { icon: '☄️', label: '100 Quests', description: 'Complete 100 quests.' },
  'year-1': { icon: '🏆', label: '1 Year in Life RPG', description: 'Survive one full year in Life RPG.' },
  'year-2': { icon: '👑', label: '2 Years in Life RPG', description: 'Survive two full years in Life RPG.' },
  'year-3': { icon: '🌌', label: '3 Years in Life RPG', description: 'Survive three full years in Life RPG.' },
  'first-100-xp': { icon: '✦', label: '100 XP', description: 'Earn your first 100 XP.' },
  'first-level': { icon: '⬆️', label: 'Level One', description: 'Reach level one.' },
};

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const attributes = user.attributes || {};
  const bestAttribute = ATTRIBUTE_META.map((attr) => ({...attr, value: attributes[attr.key] || 0}))
    .sort((a, b) => b.value - a.value)[0];

  const ownedBadges = Array.isArray(user.badges) ? user.badges : [];
  const badgeList = Object.entries(BADGE_CATALOG).map(([id, badge]) => ({ id, ...badge, owned: ownedBadges.includes(id) }));

  const coachAdvice = user.streak?.current >= 7
    ? 'You are trending well — protect the streak with one small task today.'
    : 'Start with a tiny repeatable quest to rebuild a daily streak.';

  const focusLabel = bestAttribute?.label || 'discipline';
  const nextQuest = user.totalXp >= 100 ? 'Claim a new quest and turn effort into XP.' : 'Complete one quest to unlock your first 100 XP badge.';

  return (
    <div className="page profile-page">
      <section className="profile-hero">
        <div className="profile-identity">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{user.username?.slice(0, 2).toUpperCase() || 'AR'}</div>
          </div>
          <div className="profile-identity-copy">
            <span className="profile-kicker">Adventurer record</span>
            <h1 className="profile-name">{user.username}</h1>
            <div className="profile-meta">
              <span className="profile-chip">Level {user.level}</span>
              <span className="profile-chip">{user.gold} 🪙</span>
              <span className="profile-chip">{user.streak?.current || 0} day streak</span>
            </div>
          </div>
        </div>

        <div className="profile-score-card">
          <span className="profile-score-label">Total XP</span>
          <span className="profile-score-value">{user.totalXp || 0}</span>
          <span className="profile-score-sub">Next level {user.xpIntoLevel || 0}/{user.xpForNextLevel || 0}</span>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-panel panel">
          <div className="panel-title">Account</div>
          <div className="profile-detail-list">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Email</span>
              <span className="profile-detail-value">{user.email}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Joined</span>
              <span className="profile-detail-value">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Best focus</span>
              <span className="profile-detail-value">{bestAttribute?.label}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Theme</span>
              <span className="profile-detail-value">{user.equippedTheme || 'Default'}</span>
            </div>
          </div>
        </div>

        <div className="profile-panel panel">
          <div className="panel-title">Attribute growth</div>
          <div className="profile-attributes">
            {ATTRIBUTE_META.map((attr) => {
              const value = attributes[attr.key] || 0;
              const pct = Math.max(12, Math.min(100, (value / 20) * 100));
              return (
                <div className="profile-attr-row" key={attr.key}>
                  <div className="profile-attr-head">
                    <span className="profile-attr-name"><span className="profile-attr-icon">{attr.icon}</span>{attr.label}</span>
                    <span className="profile-attr-value">{value}</span>
                  </div>
                  <div className="profile-attr-track">
                    <motion.div className="profile-attr-fill" style={{ width: `${pct}%`, background: attr.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="profile-lower-grid">
        <div className="panel profile-panels">
          <div className="panel-title">Inventory</div>
          <div className="profile-inventory">
            {(user.inventory?.length ? user.inventory : ['default']).map((item, idx) => (
              <div className="inventory-swatch" key={item || idx}>
                <span className="inventory-icon">{item === 'default' ? '✦' : '🎒'}</span>
                <span className="inventory-name">{item === 'default' ? 'Starter pack' : item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel profile-panels">
          <div className="panel-title">Quest momentum</div>
          <div className="profile-momentum">
            <div className="momentum-stat">
              <span className="momentum-number">{user.streak?.current || 0}</span>
              <span className="momentum-label">Current streak</span>
            </div>
            <div className="momentum-stat">
              <span className="momentum-number">{user.streak?.longest || 0}</span>
              <span className="momentum-label">Best streak</span>
            </div>
            <div className="momentum-stat">
              <span className="momentum-number">{user.level || 1}</span>
              <span className="momentum-label">Current level</span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-feature-grid">
        <div className="panel profile-feature-panel">
          <div className="panel-title">AI Coach</div>
          <div className="coach-card">
            <div className="coach-icon">✦</div>
            <div className="coach-content">
              <div className="coach-head">Focus route</div>
              <p>{coachAdvice}</p>
              <div className="coach-small-row">
                <span>Best focus: {focusLabel}</span>
                <span>|</span>
                <span>Quest target: {nextQuest}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel profile-feature-panel">
          <div className="panel-title">Streak Arena</div>
          <div className="arena-card">
            <div className="arena-score">
              <span className="arena-big">{user.streak?.current || 0}</span>
              <span className="arena-unit">day streak</span>
            </div>
            <div className="arena-list">
              <div className="arena-row"><span className="arena-rank">01</span><span className="arena-name">You</span><span className="arena-value">{user.streak?.current || 0}d</span></div>
              <div className="arena-row"><span className="arena-rank">02</span><span className="arena-name">Disciple</span><span className="arena-value">8d</span></div>
              <div className="arena-row"><span className="arena-rank">03</span><span className="arena-name">Sage</span><span className="arena-value">6d</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel profile-badges-section">
        <div className="panel-title">Badges</div>
        <div className="profile-badges-grid">
          {badgeList.map((badge) => (
            <div className="badge-card" key={badge.id}>
              <span className={`badge-icon ${badge.owned ? 'owned' : 'locked'}`}>{badge.icon}</span>
              <span className="badge-name">{badge.label}</span>
              <span className="badge-description">{badge.description}</span>
              <span className="badge-state">{badge.owned ? 'Unlocked' : 'Locked'}</span>
            </div>
          ))}
        </div>
      </section>

      <ContributionHeatmap />
    </div>
  );
}
