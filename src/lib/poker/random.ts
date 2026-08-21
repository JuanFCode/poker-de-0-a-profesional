/**
 * Generador aleatorio con semilla (xorshift32).
 *
 * Lo comparten el Monte Carlo de equity y el reparto del juego: con la misma
 * semilla sale la misma mano, que es justo lo que necesitan los tests.
 */

export function createRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

/** Semilla derivada de otra, para encadenar manos sin repetir baraja. */
export const nextSeed = (seed: number): number => Math.floor(createRandom(seed)() * 0x7fffffff) || 1;

/** Baraja mezclada (Fisher-Yates) a partir de una lista de cartas. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
