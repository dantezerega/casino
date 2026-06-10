import {
  useBlackjackStore,
  selectPlayerTotal,
  selectDealerVisibleTotal,
} from '@/store/blackjackStore';
import { Hand } from '@/components/blackjack/Hand';
import { TableBurst } from '@/components/blackjack/TableBurst';
import { BetChip } from '@/components/blackjack/BetChip';

/** Center felt: dealer hand on top, player hand below. */
export function BlackjackTable() {
  const status = useBlackjackStore((s) => s.status);
  const playerHand = useBlackjackStore((s) => s.playerHand);
  const dealerHand = useBlackjackStore((s) => s.dealerHand);
  const holeHidden = useBlackjackStore((s) => s.dealerHoleHidden);
  const playerTotal = useBlackjackStore(selectPlayerTotal);
  const dealerTotal = useBlackjackStore(selectDealerVisibleTotal);

  const idle = status === 'IDLE';

  return (
    <div className="relative flex min-h-[24rem] flex-col justify-between gap-6 overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,#1c3a2e_0%,#16293a_70%)] p-6 ring-1 ring-white/5 sm:min-h-[28rem]">
      <TableBurst />
      <BetChip />

      <Hand
        title="Dealer"
        cards={dealerHand}
        total={dealerTotal}
        hideHoleIndex={holeHidden ? 1 : undefined}
        baseDelay={0.12}
      />

      <div className="text-center text-xs font-medium uppercase tracking-[0.3em] text-white/20">
        {idle ? 'Place a bet to deal' : 'Blackjack pays 3 : 2'}
      </div>

      <Hand title="Player" cards={playerHand} total={playerTotal} />
    </div>
  );
}
