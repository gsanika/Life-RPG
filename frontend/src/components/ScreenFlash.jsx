import { AnimatePresence, motion } from 'framer-motion';

export default function ScreenFlash({ flashKey, color = 'rgba(228,185,78,0.35)' }) {
  return (
    <AnimatePresence>
      {flashKey > 0 && (
        <motion.div
          key={flashKey}
          className="screen-flash"
          style={{ background: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, times: [0, 0.15, 1], ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  );
}