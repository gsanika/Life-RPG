import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber.jsx';
import PopOnChange from './PopOnChange.jsx';

const MILESTONES = [
  { at: 3, label: '3-Day Spark' },
  { at: 7, label: '7-Day Warrior' },
  { at: 14, label: '14-Day Vanguard' },
  { at: 30, label: '30-Day Legend' },
];

export default function StreakBadge({ streak }) {
  const current = streak?.current || 0;
  const pulseDuration = Math.max(0.7, 1.8 - current * 0.04);
  const glowStrength = 6 + Math.min(current, 30) * 1.2;
  const glowOpacity = 0.3 + Math.min(current, 30) * 0.02;

  return (
    <div className="panel">
      <p className="panel-title">CONSISTENCY</p>
      <motion.div
        className="streak-flame"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: `drop-shadow(0 0 ${glowStrength}px rgba(228,99,75,${glowOpacity}))` }}
      >
        🔥
      </motion.div>
      <div className="streak-num">
        <PopOnChange value={current}><AnimatedNumber value={current} /></PopOnChange>
      </div>
      <p className="streak-caption">day streak · best {streak?.longest || 0}</p>

      {MILESTONES.map((m) => (
        <div key={m.at} className={`milestone-row${current >= m.at ? ' hit' : ''}`}>
          <span>{m.label}</span>
          <span>{current >= m.at ? '✓' : `${m.at}d`}</span>
        </div>
      ))}
    </div>
  );
}