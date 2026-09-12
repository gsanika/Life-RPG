import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function AnimatedNumber({ value, duration = 0.6 }) {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString());
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, duration, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}