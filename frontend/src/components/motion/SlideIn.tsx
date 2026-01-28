import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Direction = 'left' | 'right' | 'up' | 'down';

interface SlideInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
}

const directionOffsets: Record<Direction, { x: number; y: number }> = {
  left: { x: -20, y: 0 },
  right: { x: 20, y: 0 },
  up: { x: 0, y: -20 },
  down: { x: 0, y: 20 },
};

export function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  duration = 0.3,
  className,
}: SlideInProps) {
  const offset = directionOffsets[direction];

  return (
    <motion.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
