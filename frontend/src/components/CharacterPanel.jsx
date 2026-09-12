import { motion } from 'framer-motion';
import XPBar from './XPBar.jsx';
import AnimatedNumber from './AnimatedNumber.jsx';
import PopOnChange from './PopOnChange.jsx';

const ATTRIBUTES = [
  { key: 'intellect', icon: '🧠', color: 'var(--violet)' },
  { key: 'strength', icon: '💪', color: 'var(--ember)' },
  { key: 'wisdom', icon: '📖', color: 'var(--emerald)' },
  { key: 'discipline', icon: '🧘', color: 'var(--teal)' },
  { key: 'charisma', icon: '🗣️', color: 'var(--rose)' },
  { key: 'creativity', icon: '⚙️', color: 'var(--gold)' },
];

export default function CharacterPanel({ character }) {
  if (!character) return null;
  const maxAttrForScale = Math.max(20, ...ATTRIBUTES.map((a) => character.attributes?.[a.key] || 0));

  return (
    <div className="panel">
      <motion.div
        className="level-badge"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        <span className="num"><AnimatedNumber value={character.level} /></span>
        <span className="lbl">LEVEL</span>
      </motion.div>

      <h2 className="character-name">{character.username}</h2>
      <p className="character-sub">Adventurer since {new Date(character.createdAt).toLocaleDateString()}</p>

      <XPBar xpIntoLevel={character.xpIntoLevel} xpForNextLevel={character.xpForNextLevel} />

      <div style={{ marginTop: 22 }}>
        {ATTRIBUTES.map((attr) => {
          const value = character.attributes?.[attr.key] || 0;
          const pct = Math.min(100, (value / maxAttrForScale) * 100);
          return (
            <div className="attr-row" key={attr.key}>
              <span className="attr-icon">{attr.icon}</span>
              <div className="attr-body">
                <div className="attr-head">
                  <span className="attr-name" style={{ textTransform: 'capitalize' }}>{attr.key}</span>
                  <span className="attr-val"><AnimatedNumber value={value} /></span>
                </div>
                <div className="attr-track">
                  <motion.div
                    className="attr-fill"
                    style={{ background: attr.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gold-line">
        🪙 <PopOnChange value={character.gold}><AnimatedNumber value={character.gold} /></PopOnChange>
      </div>
    </div>
  );
}