import { hmacSha256Bytes, utf8 } from '@/utils/crypto';
import type { ProvablyFairSeeds } from '@/types';
import { PLINKO_ROWS, type Direction, type PlinkoPath, type PlinkoRows } from '@/game/plinko/types';

function assertRows(rows: number): asserts rows is PlinkoRows {
  if (!PLINKO_ROWS.includes(rows as PlinkoRows)) {
    throw new RangeError(`rows must be one of ${PLINKO_ROWS.join(', ')}, got ${rows}`);
  }
}

function* floatStream(seeds: ProvablyFairSeeds): Generator<number> {
  const key = utf8(seeds.serverSeed);
  let round = 0;
  while (true) {
    const block = hmacSha256Bytes(key, utf8(`${seeds.clientSeed}:${seeds.nonce}:${round}`));
    for (let i = 0; i + 4 <= block.length; i += 4) {
      const float =
        block[i] / 256 +
        block[i + 1] / 256 ** 2 +
        block[i + 2] / 256 ** 3 +
        block[i + 3] / 256 ** 4;
      yield float;
    }
    round += 1;
  }
}

export function generatePath(seeds: ProvablyFairSeeds, rows: PlinkoRows): PlinkoPath {
  assertRows(rows);
  const rng = floatStream(seeds);
  const path: Direction[] = [];
  for (let i = 0; i < rows; i++) {
    const r = rng.next().value as number;
    path.push(r < 0.5 ? 'L' : 'R');
  }
  return path;
}

export function slotFromPath(path: PlinkoPath): number {
  return path.reduce((count, dir) => count + (dir === 'R' ? 1 : 0), 0);
}
