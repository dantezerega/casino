import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import type { Card as CardModel, Suit } from '@/game/blackjack/types';

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const isRed = (suit: Suit): boolean => suit === 'hearts' || suit === 'diamonds';

/** The printed face of a card (rank + suit pips). */
function CardFace({ card }: { card: CardModel }) {
  const red = isRed(card.suit);
  const color = red ? 'text-danger' : 'text-[#1a2c38]';
  const symbol = SUIT_SYMBOL[card.suit];
  return (
    <div className="absolute inset-0 rounded-lg bg-white [backface-visibility:hidden]">
      <div className={`absolute left-1.5 top-1 text-left leading-none ${color}`}>
        <div className="text-sm font-bold sm:text-base">{card.rank}</div>
        <div className="text-xs sm:text-sm">{symbol}</div>
      </div>
      <div className={`absolute inset-0 grid place-items-center text-2xl sm:text-3xl ${color}`}>
        {symbol}
      </div>
      <div className={`absolute bottom-1 right-1.5 rotate-180 text-right leading-none ${color}`}>
        <div className="text-sm font-bold sm:text-base">{card.rank}</div>
        <div className="text-xs sm:text-sm">{symbol}</div>
      </div>
    </div>
  );
}

/** The patterned back, pre-rotated so it shows when the flip is at 180°. */
function CardBack() {
  return (
    <div className="absolute inset-0 rounded-lg border border-white/10 bg-gradient-to-br from-[#22425a] to-[#16293a] [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <div className="absolute inset-1.5 rounded-md border border-white/10 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0_6px,transparent_6px_12px)]" />
    </div>
  );
}

/**
 * A playing card with motion: deals in from the shoe (slide + spring, staggered
 * by `index`/`baseDelay`) and flips between back and face via 3D `rotateY` when
 * `faceDown` toggles. Honors reduced-motion.
 */
export function Card({
  card,
  faceDown = false,
  index = 0,
  baseDelay = 0,
  animateIn = true,
  className = '',
}: {
  card?: CardModel;
  faceDown?: boolean;
  index?: number;
  baseDelay?: number;
  animateIn?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { play } = useSound();
  // Tracks the prior face-down state so card-flip plays only on an actual
  // reveal (face-down → face-up), never on mount or for static up-cards.
  const wasFaceDown = useRef(faceDown);
  const base = 'relative aspect-[5/7] w-14 shrink-0 sm:w-16 md:w-[4.5rem]';

  // Empty-slot placeholder (no card): static back, no animation.
  if (!card) {
    return (
      <div className={`${base} ${className}`} aria-label="Face-down card">
        <div className="absolute inset-0 rounded-lg border border-white/10 bg-gradient-to-br from-[#22425a] to-[#16293a]">
          <div className="absolute inset-1.5 rounded-md border border-white/10 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0_6px,transparent_6px_12px)]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`${base} [perspective:900px] ${className}`}
      aria-label={faceDown ? 'Face-down card' : `${card.rank} of ${card.suit}`}
      // Deal swipe fires as the card slides in from the shoe.
      onAnimationStart={() => play('card-deal')}
      initial={
        animateIn && !reduce
          ? { opacity: 0, x: -40, y: -60, rotate: -10, scale: 0.85 }
          : false
      }
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 26,
        delay: reduce ? 0 : baseDelay + index * 0.16,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-lg shadow-lg [transform-style:preserve-3d]"
        // Flip sound only when a face-down card turns face-up (hole reveal).
        onAnimationStart={() => {
          const flipping = wasFaceDown.current && !faceDown;
          wasFaceDown.current = faceDown;
          if (flipping) play('card-flip');
        }}
        initial={false}
        animate={{ rotateY: faceDown ? 180 : 0 }}
        transition={{ duration: reduce ? 0 : 0.45, ease: 'easeInOut' }}
      >
        <CardFace card={card} />
        <CardBack />
      </motion.div>
    </motion.div>
  );
}
