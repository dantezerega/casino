import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { verifyRound } from '@/game/provablyFair';
import { GRID_SIZE } from '@/types';
import { DiceIcon } from '@/components/icons';

/** Read-only labelled row showing a (possibly long) seed value. */
function SeedRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div
        className={`break-all rounded-md bg-bg px-3 py-2 text-xs ring-1 ring-white/10 ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value || <span className="text-muted">—</span>}
      </div>
    </div>
  );
}

/**
 * Provably-fair drawer. Shows the active client seed (editable when not
 * playing), nonce, and the hashed server-seed commitment. Once a round ends the
 * plaintext server seed is revealed and the board can be independently verified
 * via the engine's `verifyRound`.
 */
export function ProvablyFairPanel() {
  const [open, setOpen] = useState(false);

  const status = useGameStore((s) => s.status);
  const clientSeed = useGameStore((s) => s.clientSeed);
  const nonce = useGameStore((s) => s.nonce);
  const commitment = useGameStore((s) => s.commitment);
  const round = useGameStore((s) => s.round);
  const setClientSeed = useGameStore((s) => s.setClientSeed);
  const regenerateClientSeed = useGameStore((s) => s.regenerateClientSeed);

  const ended = status === 'LOST' || status === 'CASHED_OUT';
  const canEdit = status !== 'PLAYING';

  // Live verification once seeds are revealed (round ended).
  const verification = useMemo(() => {
    if (!ended || !round || !commitment) return null;
    return verifyRound(round.seeds, round.mineCount, commitment.serverSeedHash);
  }, [ended, round, commitment]);

  return (
    <section className="rounded-xl bg-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <DiceIcon className="h-4 w-4 text-accent" />
          Provably Fair
        </span>
        <span className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="pf-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-white/5 p-4">
          {/* Client seed — editable when not playing */}
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
              Client Seed
            </div>
            <div className="flex overflow-hidden rounded-md bg-bg ring-1 ring-white/10 focus-within:ring-accent/50">
              <input
                value={clientSeed}
                disabled={!canEdit}
                onChange={(e) => setClientSeed(e.currentTarget.value)}
                className="w-full bg-transparent px-3 py-2 font-mono text-xs outline-none disabled:opacity-60"
              />
              <button
                type="button"
                disabled={!canEdit}
                onClick={regenerateClientSeed}
                title="Randomize client seed"
                className="grid place-items-center px-3 text-muted transition-colors hover:text-white disabled:opacity-40"
              >
                <DiceIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <SeedRow label="Nonce" value={String(nonce)} mono={false} />
          <SeedRow
            label="Server Seed (Hashed)"
            value={commitment?.serverSeedHash ?? ''}
          />

          {/* Revealed only after the round resolves */}
          <SeedRow
            label="Server Seed (Revealed)"
            value={ended ? (round?.seeds.serverSeed ?? '') : 'Hidden until round ends'}
            mono={ended}
          />

          {verification && round && (
            <div className="rounded-md bg-bg p-3 ring-1 ring-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Hash matches commitment</span>
                <span
                  className={
                    verification.hashValid
                      ? 'font-semibold text-accent'
                      : 'font-semibold text-danger'
                  }
                >
                  {verification.hashValid ? '✓ Valid' : '✗ Invalid'}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted">
                Mine positions (row, col)
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {verification.minePositions.map((p) => (
                  <span
                    key={p}
                    className="rounded bg-danger/15 px-1.5 py-0.5 font-mono text-[11px] text-danger"
                  >
                    {Math.floor(p / GRID_SIZE) + 1},{(p % GRID_SIZE) + 1}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-muted">
            Before each round the hashed server seed is committed. After it ends
            the plaintext seed is revealed — hashing it must reproduce the
            commitment, and the same seeds always regenerate this exact board.
          </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
