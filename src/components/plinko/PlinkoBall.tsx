import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { PlinkoPath, PlinkoRows } from '@/game/plinko/types';
import { useSound } from '@/hooks/useSound';
import { BALL_R, ballWaypoints } from '@/components/plinko/geometry';

const GRAVITY = 3200;
const RESTITUTION = 0.5;

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

  const onLandRef = useRef(onLand);
  onLandRef.current = onLand;
  const playRef = useRef(play);
  playRef.current = play;

  const pts = ballWaypoints(path, rows);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const points = ballWaypoints(path, rows);
    const last = points[points.length - 1];

    if (reduce) {
      el.setAttribute('cx', String(last.x));
      el.setAttribute('cy', String(last.y));
      onLandRef.current();
      return;
    }

    const segments = buildSegments(path, rows);
    let seg = 0;
    let segStartTs = 0;
    let raf = 0;
    let done = false;

    const tick = (now: number) => {
      if (segStartTs === 0) segStartTs = now;
      const s = segments[seg];
      const t = Math.min((now - segStartTs) / 1000, s.duration);
      el.setAttribute('cx', String(s.x0 + (s.x1 - s.x0) * (t / s.duration)));
      el.setAttribute('cy', String(s.y0 + s.vy0 * t + 0.5 * GRAVITY * t * t));

      if (t >= s.duration) {
        el.setAttribute('cx', String(s.x1));
        el.setAttribute('cy', String(s.y1));
        seg += 1;
        segStartTs = 0;
        if (seg < segments.length) {
          if (seg < rows + 1) playRef.current('peg-hit');
          raf = requestAnimationFrame(tick);
        } else if (!done) {
          done = true;
          onLandRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Run the sim exactly once per ball (path/rows are fixed for this id).
  }, [path, rows, reduce]);

  return <circle ref={ref} cx={pts[0].x} cy={pts[0].y} r={BALL_R} fill="var(--color-gold)" />;
}
