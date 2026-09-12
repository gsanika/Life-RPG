import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function PopOnChange({ value, children }) {
  const prevValue = useRef(value);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (prevValue.current !== value) {
      setBump((b) => b + 1);
      prevValue.current = value;
    }
  }, [value]);

  return (
    <motion.span
      key={bump}
      initial={bump === 0 ? false : { scale: 1.35 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      style={{ display: 'inline-flex' }}
    >
      {children}
    </motion.span>
  );
}