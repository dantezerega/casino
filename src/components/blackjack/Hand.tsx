import type { Hand as HandModel } from '@/game/blackjack/types';
import { Card } from '@/components/blackjack/Card';

/**
 * A labelled row of cards with a running total badge. When `hideHoleIndex` is
 * set, that card renders face-down (the dealer's hole during the player's turn)
 * and `total` reflects only the visible cards.
 */
export function Hand({
  title,
  cards,
  total,
  hideHoleIndex,
  baseDelay = 0,
}: {
  title: string;
  cards: HandModel;
  total: number;
  hideHoleIndex?: number;
  /** Stagger offset so dealer/player hands deal in sequence. */
  baseDelay?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </span>
        {cards.length > 0 && (
          <span className="rounded-md bg-bg px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ring-white/10">
            {total}
          </span>
        )}
      </div>

      <div className="flex min-h-[5.5rem] items-center justify-center gap-1.5 sm:min-h-[6.5rem]">
        {cards.length === 0 ? (
          <Card faceDown className="opacity-30" />
        ) : (
          cards.map((card, i) => (
            <Card
              key={`${card.rank}-${card.suit}-${i}`}
              card={card}
              faceDown={i === hideHoleIndex}
              index={i}
              baseDelay={baseDelay}
            />
          ))
        )}
      </div>
    </div>
  );
}
