import { motion } from 'framer-motion';

const COLORS = ['var(--gold)', 'var(--violet)', 'var(--emerald)', 'var(--gold-hot)'];
const PARTICLE_COUNT = 10;

export default function ParticleBurst({ onComplete }) {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 40 + Math.random() * 30;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: COLORS[i % COLORS.length],
    };
  });

  return (
    <div className="particle-burst">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="particle-dot"
          style={{ background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          onAnimationComplete={p.id === PARTICLE_COUNT - 1 ? onComplete : undefined}
        />
      ))}
    </div>
  );
}