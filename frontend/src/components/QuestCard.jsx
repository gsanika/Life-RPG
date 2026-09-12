import { motion } from 'framer-motion';

const ATTRIBUTE_COLOR = {
  intellect: 'var(--violet)',
  strength: 'var(--ember)',
  wisdom: 'var(--emerald)',
  discipline: 'var(--teal)',
  charisma: 'var(--rose)',
  creativity: 'var(--gold)',
};

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

export default function QuestCard({ quest, onComplete, onDelete, completing }) {
  const done = quest.recurring ? quest.completedToday : quest.completed;
  const difficultyRewards = DIFFICULTY_REWARDS[quest.difficulty] || DIFFICULTY_REWARDS.medium;
  const scale = quest.scale || 'daily';
  const multiplier = SCALE_MULTIPLIERS[scale] || 1;
  const rewards = {
    xp: difficultyRewards.xp * multiplier,
    gold: difficultyRewards.gold * multiplier,
  };
  const accent = ATTRIBUTE_COLOR[quest.attribute] || 'var(--violet)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className={`quest-card${done ? ' done' : ''} ${quest.isBoss ? 'boss-quest' : ''}`}
      style={{ '--accent': accent }}
    >
      <div className="quest-info">
        <p className={`quest-title${done ? ' done' : ''}`}>{quest.title}</p>
        <div className="quest-meta">
          <span className="quest-tag" style={{ textTransform: 'capitalize' }}>{quest.category}</span>
          <span className="quest-tag" style={{ textTransform: 'capitalize' }}>{quest.difficulty}</span>
          <span className="quest-tag" style={{ textTransform: 'capitalize' }}>{scale}</span>
          <span className="quest-tag" style={{ textTransform: 'capitalize' }}>{quest.questType || 'custom'}</span>
          <span className="quest-tag" style={{ textTransform: 'capitalize' }}>{quest.verification || 'manual'}</span>
          {quest.recurring && <span className="quest-tag">Daily</span>}
          {quest.isBoss && <span className="quest-tag boss-tag">👹 Boss</span>}
        </div>
        {quest.isBoss && quest.bossName && <div className="quest-boss-name">Boss: {quest.bossName}</div>}
        {quest.target && <div className="quest-target">Evidence: {quest.target}</div>}
      </div>

      <div className="quest-rewards">
        <span className="reward-xp">+{rewards.xp} XP</span>
        <span className="reward-gold">+{rewards.gold} 🪙</span>
      </div>

      <div className="quest-actions">
        <button
          className={`btn ${done ? '' : 'btn-primary'}`}
          disabled={done || completing}
          onClick={() => onComplete(quest._id)}
        >
          {done ? 'Done' : completing ? '…' : 'Complete'}
        </button>
        <button className="icon-btn" title="Retire quest" onClick={() => onDelete(quest._id)}>
          ✕
        </button>
      </div>
    </motion.div>
  );
}
