import { motion } from 'framer-motion';

export default function XPBar({ xpIntoLevel, xpForNextLevel }) {
  const pct = xpForNextLevel > 0 ? Math.min(100, (xpIntoLevel / xpForNextLevel) * 100) : 100;

  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-track">
        <motion.div
          className="xp-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="xp-bar-caption">
        <span>{xpIntoLevel} XP</span>
        <span>{xpForNextLevel} XP to next level</span>
      </div>
    </div>
  );
}
