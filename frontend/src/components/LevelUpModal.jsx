import { AnimatePresence, motion } from 'framer-motion';

export default function LevelUpModal({ result, onClose }) {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="levelup-card"
            initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="levelup-eyebrow">Level Up</p>
            <p className="levelup-level">{result.newLevel}</p>
            <p className="levelup-bonus">
              +{result.goldBonus} bonus gold{result.levelsGained > 1 ? ` · ${result.levelsGained} levels at once` : ''}
            </p>
            <button className="btn btn-gold" onClick={onClose}>
              Continue adventuring
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
