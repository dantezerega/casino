import { useGameStore } from '@/store/gameStore';
import { GRID_SIZE, TILE_COUNT } from '@/types';
import { Tile } from '@/components/Tile';

/**
 * 5×5 game board. When IDLE (no round yet) it renders inert placeholder tiles
 * so the layout never collapses before the first bet.
 */
export function Board() {
  const tiles = useGameStore((s) => s.tiles);
  const status = useGameStore((s) => s.status);

  const hasBoard = tiles.length === TILE_COUNT;

  return (
    <div
      className="grid w-full gap-2 sm:gap-2.5"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      aria-label="Mines board"
      data-status={status}
    >
      {hasBoard
        ? tiles.map((tile) => <Tile key={tile.index} tile={tile} />)
        : Array.from({ length: TILE_COUNT }, (_, i) => (
            <div
              key={i}
              className="aspect-square w-full rounded-lg border-b-4 border-black/30 bg-tile/60"
            />
          ))}
    </div>
  );
}
