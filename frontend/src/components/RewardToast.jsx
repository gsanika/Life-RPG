import { AnimatePresence, motion } from 'framer-motion';

export default function RewardToast({ reward }) {
  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          className="reward-toast"
          initial={{ opacity: 0, x: 40, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <div className="reward-toast-title">⚔️ Quest Complete</div>
          <div className="reward-toast-line">+{reward.xpEarned} XP · +{reward.goldEarned} 🪙</div>
          <div className="reward-toast-line" style={{ textTransform: 'capitalize' }}>
            +{reward.attributeGained} {reward.attribute}
          </div>
          {reward.streakMilestone && (
            <div className="reward-toast-line" style={{ color: 'var(--gold)', marginTop: 4 }}>
              🔥 {reward.streakMilestone.label} unlocked!
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
