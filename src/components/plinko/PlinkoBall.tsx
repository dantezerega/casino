import { motion, useReducedMotion } from 'framer-motion';
import type { PlinkoPath, PlinkoRows } from '@/game/plinko/types';
import { BALL_R, ballWaypoints } from '@/components/plinko/geometry';

export function PlinkoBall({
  path,
  rows,
  onLand,
}: {
  path: PlinkoPath;
  rows: PlinkoRows;
  onLand: () => void;
}) {
  const reduce = useReducedMotion();
  const points = ballWaypoints(path, rows);
  const last = points[points.length - 1];

  if (reduce) {
    return (
      <motion.circle
        cx={last.x}
        cy={last.y}
        r={BALL_R}
        fill="var(--color-gold)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0 }}
        onAnimationComplete={onLand}
      />
    );
  }

  const stepDuration = 0.13;
  return (
    <motion.circle
      r={BALL_R}
      fill="var(--color-gold)"
      initial={{ cx: points[0].x, cy: points[0].y }}
      animate={{
        cx: points.map((p) => p.x),
        cy: points.map((p) => p.y),
      }}
      transition={{
        duration: stepDuration * (points.length - 1),
        ease: 'easeIn',
        times: points.map((_, i) => i / (points.length - 1)),
      }}
      onAnimationComplete={onLand}
    />
  );
}
