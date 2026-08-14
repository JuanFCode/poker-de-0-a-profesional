/**
 * Notación de manos preflop.
 *
 * Las 1326 combinaciones de dos cartas se reducen a 169 "manos" cuando el palo
 * concreto da igual: 13 parejas (AA), 78 suited (AKs) y 78 offsuit (AKo).
 * Los rangos se escriben en la notación estándar — "22+, A2s+, KTo+, 76s-54s" —
 * y aquí se expanden a esas 169 manos.
 */

import { RANKS, rankIndex, rankOf, suitOf, type Card } from "./cards";

export type HandCode = string; // "AA" | "AKs" | "AKo"

/** Combinaciones posibles de una mano: 6 por pareja, 4 suited, 12 offsuit. */
export function comboCount(hand: HandCode): number {
  if (hand.length === 2) return 6;
  return hand.endsWith("s") ? 4 : 12;
}

export const TOTAL_COMBOS = 1326;

export function handCode(rankA: number, rankB: number, suited: boolean): HandCode {
  const high = Math.max(rankA, rankB);
  const low = Math.min(rankA, rankB);
  if (high === low) return RANKS[high] + RANKS[low];
  return RANKS[high] + RANKS[low] + (suited ? "s" : "o");
}

/** Mano de dos cartas concretas → su código ("AhKh" → "AKs"). */
export function handCodeOf(a: Card, b: Card): HandCode {
  return handCode(rankOf(a), rankOf(b), suitOf(a) === suitOf(b));
}

/**
 * La grid 13x13 clásica: fila y columna van de A (0) a 2 (12).
 * Diagonal = parejas, arriba a la derecha = suited, abajo a la izquierda = offsuit.
 */
export function handAt(row: number, col: number): HandCode {
  const rankA = 12 - row;
  const rankB = 12 - col;
  if (row === col) return handCode(rankA, rankB, false);
  return handCode(rankA, rankB, col > row);
}

export const GRID: HandCode[][] = Array.from({ length: 13 }, (_, row) =>
  Array.from({ length: 13 }, (_, col) => handAt(row, col)),
);

export const ALL_HANDS: HandCode[] = GRID.flat();

function parseHand(token: string): HandCode {
  const text = token.trim();
  const match = /^([2-9TJQKA])([2-9TJQKA])([so])?$/i.exec(text);
  if (!match) throw new Error(`Mano inválida: "${token}"`);
  const [, a, b, suffix] = match;
  const rankA = rankIndex(a);
  const rankB = rankIndex(b);
  if (rankA === rankB) return handCode(rankA, rankB, false);
  if (!suffix) throw new Error(`Falta "s" u "o" en "${token}"`);
  return handCode(rankA, rankB, suffix.toLowerCase() === "s");
}

/** "77+" → 77, 88 ... AA. "A2s+" → A2s ... AKs. "KTo+" → KTo, KJo, KQo. */
function expandPlus(hand: HandCode): HandCode[] {
  const high = rankIndex(hand[0]);
  const low = rankIndex(hand[1]);
  const out: HandCode[] = [];
  if (hand.length === 2) {
    for (let rank = low; rank <= 12; rank++) out.push(handCode(rank, rank, false));
    return out;
  }
  const suited = hand.endsWith("s");
  for (let kicker = low; kicker < high; kicker++) out.push(handCode(high, kicker, suited));
  return out;
}

/** "A5s-A2s" (mismo palo alto) y "76s-54s" (conectores del mismo gap). */
function expandSpan(from: HandCode, to: HandCode): HandCode[] {
  if (from.length !== to.length) throw new Error(`Rango incompatible: "${from}-${to}"`);
  const out: HandCode[] = [];

  if (from.length === 2) {
    const a = rankIndex(from[0]);
    const b = rankIndex(to[0]);
    for (let rank = Math.min(a, b); rank <= Math.max(a, b); rank++) {
      out.push(handCode(rank, rank, false));
    }
    return out;
  }

  const suited = from.endsWith("s");
  if (suited !== to.endsWith("s")) throw new Error(`Rango incompatible: "${from}-${to}"`);
  const highA = rankIndex(from[0]);
  const lowA = rankIndex(from[1]);
  const highB = rankIndex(to[0]);
  const lowB = rankIndex(to[1]);

  if (highA === highB) {
    for (let kicker = Math.min(lowA, lowB); kicker <= Math.max(lowA, lowB); kicker++) {
      if (kicker !== highA) out.push(handCode(highA, kicker, suited));
    }
    return out;
  }

  if (highA - lowA !== highB - lowB) throw new Error(`Rango incompatible: "${from}-${to}"`);
  const gap = highA - lowA;
  const start = Math.min(highA, highB);
  const end = Math.max(highA, highB);
  for (let high = start; high <= end; high++) out.push(handCode(high, high - gap, suited));
  return out;
}

/**
 * Expande una lista en notación estándar a manos concretas.
 * Separadores: comas, espacios o saltos de línea. Ignora tokens vacíos.
 */
export function expandRange(text: string): Set<HandCode> {
  const result = new Set<HandCode>();
  for (const raw of text.split(/[,\n]+/)) {
    const token = raw.trim();
    if (!token) continue;
    if (token.includes("-")) {
      const [from, to] = token.split("-");
      for (const hand of expandSpan(parseHand(from), parseHand(to))) result.add(hand);
    } else if (token.endsWith("+")) {
      for (const hand of expandPlus(parseHand(token.slice(0, -1)))) result.add(hand);
    } else {
      for (const part of token.split(/\s+/)) {
        if (part) result.add(parseHand(part));
      }
    }
  }
  return result;
}

/** Porcentaje de las 1326 combinaciones que cubre un conjunto de manos. */
export function rangePercent(hands: Iterable<HandCode>): number {
  let combos = 0;
  for (const hand of hands) combos += comboCount(hand);
  return (combos / TOTAL_COMBOS) * 100;
}
