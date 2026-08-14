/**
 * Evaluador de manos de Texas Hold'em.
 *
 * `evaluate` acepta 5, 6 o 7 cartas y devuelve un entero: cuanto más alto,
 * mejor mano. Dos manos empatan si y solo si su puntuación es idéntica, así
 * que el mismo número sirve para comparar y para detectar splits.
 *
 * Codificación (24 bits):  categoría << 20 | k1 << 16 | k2 << 12 | k3 << 8 | k4 << 4 | k5
 * Los kickers van en orden de importancia y usan el índice de rango (0 = 2, 12 = A),
 * que es exactamente el desempate que describen las reglas oficiales: cuando la
 * categoría empata, gana la carta más alta, luego la segunda, etc.
 */

import { rankOf, suitOf, type Card } from "./cards";

export const CATEGORY = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
} as const;

export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];

/** Nombre en español de cada categoría, de peor a mejor. */
export const CATEGORY_NAMES: Record<Category, string> = {
  [CATEGORY.HIGH_CARD]: "Carta alta",
  [CATEGORY.PAIR]: "Pareja",
  [CATEGORY.TWO_PAIR]: "Doble pareja",
  [CATEGORY.THREE_OF_A_KIND]: "Trío",
  [CATEGORY.STRAIGHT]: "Escalera",
  [CATEGORY.FLUSH]: "Color",
  [CATEGORY.FULL_HOUSE]: "Full",
  [CATEGORY.FOUR_OF_A_KIND]: "Póker",
  [CATEGORY.STRAIGHT_FLUSH]: "Escalera de color",
};

const encode = (category: number, kickers: number[]): number => {
  let score = category << 20;
  for (let i = 0; i < 5; i++) score |= (kickers[i] ?? 0) << (16 - i * 4);
  return score;
};

/**
 * Rango más alto que corona una escalera dentro de una máscara de 13 bits,
 * o -1 si no hay. Contempla la rueda (A-2-3-4-5), donde el as va por abajo y
 * la escalera es "al 5".
 */
function straightTop(mask: number): number {
  for (let top = 12; top >= 4; top--) {
    const window = 0b11111 << (top - 4);
    if ((mask & window) === window) return top;
  }
  const wheel = (1 << 12) | 0b1111; // A, 5, 4, 3, 2
  if ((mask & wheel) === wheel) return 3; // escalera al 5
  return -1;
}

/** Los `count` rangos más altos presentes en la máscara, de mayor a menor. */
function topRanks(mask: number, count: number): number[] {
  const out: number[] = [];
  for (let rank = 12; rank >= 0 && out.length < count; rank--) {
    if (mask & (1 << rank)) out.push(rank);
  }
  return out;
}

export function evaluate(cards: readonly Card[]): number {
  const rankCounts = new Array<number>(13).fill(0);
  const suitCounts = [0, 0, 0, 0];
  const suitMasks = [0, 0, 0, 0];
  let rankMask = 0;

  for (const card of cards) {
    const rank = rankOf(card);
    const suit = suitOf(card);
    rankCounts[rank]++;
    suitCounts[suit]++;
    suitMasks[suit] |= 1 << rank;
    rankMask |= 1 << rank;
  }

  const flushSuit = suitCounts.findIndex((n) => n >= 5);

  if (flushSuit !== -1) {
    const flushMask = suitMasks[flushSuit];
    const sfTop = straightTop(flushMask);
    if (sfTop !== -1) return encode(CATEGORY.STRAIGHT_FLUSH, [sfTop]);
  }

  // Rangos agrupados por repeticiones, de más repetido a menos y, a igualdad, del más alto al más bajo.
  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  for (let rank = 12; rank >= 0; rank--) {
    if (rankCounts[rank] === 4) quads.push(rank);
    else if (rankCounts[rank] === 3) trips.push(rank);
    else if (rankCounts[rank] === 2) pairs.push(rank);
  }

  if (quads.length > 0) {
    const quad = quads[0];
    const kicker = topRanks(rankMask & ~(1 << quad), 1)[0];
    return encode(CATEGORY.FOUR_OF_A_KIND, [quad, kicker]);
  }

  if (trips.length > 0 && (trips.length > 1 || pairs.length > 0)) {
    const trip = trips[0];
    const pair = trips.length > 1 ? Math.max(trips[1], pairs[0] ?? -1) : pairs[0];
    return encode(CATEGORY.FULL_HOUSE, [trip, pair]);
  }

  if (flushSuit !== -1) {
    return encode(CATEGORY.FLUSH, topRanks(suitMasks[flushSuit], 5));
  }

  const straight = straightTop(rankMask);
  if (straight !== -1) return encode(CATEGORY.STRAIGHT, [straight]);

  if (trips.length > 0) {
    const trip = trips[0];
    return encode(CATEGORY.THREE_OF_A_KIND, [trip, ...topRanks(rankMask & ~(1 << trip), 2)]);
  }

  if (pairs.length >= 2) {
    const [high, low] = pairs;
    const kicker = topRanks(rankMask & ~(1 << high) & ~(1 << low), 1)[0];
    return encode(CATEGORY.TWO_PAIR, [high, low, kicker]);
  }

  if (pairs.length === 1) {
    const pair = pairs[0];
    return encode(CATEGORY.PAIR, [pair, ...topRanks(rankMask & ~(1 << pair), 3)]);
  }

  return encode(CATEGORY.HIGH_CARD, topRanks(rankMask, 5));
}

export const categoryOf = (score: number): Category => (score >> 20) as Category;

/** Nombre corto de la mano, p. ej. "Doble pareja" o "Escalera de color". */
export function describe(score: number): string {
  const category = categoryOf(score);
  if (category === CATEGORY.STRAIGHT_FLUSH) {
    const top = (score >> 16) & 0xf;
    if (top === 12) return "Escalera real";
  }
  return CATEGORY_NAMES[category];
}

/** Las 5 cartas que forman la mejor mano. Solo para mostrarlas en pantalla. */
export function bestFive(cards: readonly Card[]): Card[] {
  if (cards.length <= 5) return [...cards];
  let best: Card[] = [];
  let bestScore = -1;
  const n = cards.length;
  const combo = [0, 1, 2, 3, 4];
  while (true) {
    const hand = combo.map((i) => cards[i]);
    const score = evaluate(hand);
    if (score > bestScore) {
      bestScore = score;
      best = hand;
    }
    let i = 4;
    while (i >= 0 && combo[i] === n - 5 + i) i--;
    if (i < 0) break;
    combo[i]++;
    for (let j = i + 1; j < 5; j++) combo[j] = combo[j - 1] + 1;
  }
  return best;
}
