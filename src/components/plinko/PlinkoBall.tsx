import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { PlinkoPath, PlinkoRows } from '@/game/plinko/types';
import { useSound } from '@/hooks/useSound';
import { BALL_R, ballWaypoints } from '@/components/plinko/geometry';

const GRAVITY = 1100;
const RESTITUTION = 0.55;

interface Segment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  vy0: number;
  duration: number;
}

function buildSegments(path: PlinkoPath, rows: PlinkoRows): Segment[] {
  const pts = ballWaypoints(path, rows);
  const segments: Segment[] = [];
  let vy0 = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dy = pts[i + 1].y - pts[i].y;
    const t = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * GRAVITY * dy)) / GRAVITY;
    segments.push({ x0: pts[i].x, y0: pts[i].y, x1: pts[i + 1].x, y1: pts[i + 1].y, vy0, duration: t });
    const impactVy = vy0 + GRAVITY * t;
    vy0 = -impactVy * RESTITUTION;
  }
  return segments;
}

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
  const { play } = useSound();
  const ref = useRef<SVGCircleElement | null>(null);
  const pts = ballWaypoints(path, rows);
  const last = pts[pts.length - 1];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduce) {
      el.setAttribute('cx', String(last.x));
      el.setAttribute('cy', String(last.y));
      onLand();
      return;
    }

    const segments = buildSegments(path, rows);
    let seg = 0;
    let segStart = 0;
    let raf = 0;
    let done = false;

    const tick = (now: number) => {
      if (segStart === 0) segStart = now;
      const s = segments[seg];
      const t = Math.min((now - segStart) / 1000, s.duration);
      const x = s.x0 + (s.x1 - s.x0) * (t / s.duration);
      const y = s.y0 + s.vy0 * t + 0.5 * GRAVITY * t * t;
      el.setAttribute('cx', String(x));
      el.setAttribute('cy', String(y));

      if (t >= s.duration) {
        seg += 1;
        segStart = now;
        if (seg < segments.length) {
          if (seg < rows + 1) play('peg-hit');
          raf = requestAnimationFrame(tick);
        } else if (!done) {
          done = true;
          el.setAttribute('cx', String(s.x1));
          el.setAttribute('cy', String(s.y1));
          onLand();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [path, rows, reduce, onLand, play, last.x, last.y]);

  return <circle ref={ref} cx={pts[0].x} cy={pts[0].y} r={BALL_R} fill="var(--color-gold)" />;
}
