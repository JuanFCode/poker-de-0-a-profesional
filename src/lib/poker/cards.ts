/**
 * Representación de cartas.
 *
 * Una carta es un entero 0..51:  índice = rango * 4 + palo
 *   rango: 0 = 2, 1 = 3, ... 8 = T, 9 = J, 10 = Q, 11 = K, 12 = A
 *   palo:  0 = ♣ (c), 1 = ♦ (d), 2 = ♥ (h), 3 = ♠ (s)
 *
 * El entero permite trabajar con arrays tipados en el Monte Carlo sin
 * asignar objetos por iteración.
 */

export type Card = number;

export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
export const SUITS = ["c", "d", "h", "s"] as const;
export const SUIT_SYMBOLS = ["♣", "♦", "♥", "♠"] as const;
export const SUIT_NAMES = ["Tréboles", "Diamantes", "Corazones", "Picas"] as const;

export type RankChar = (typeof RANKS)[number];
export type SuitChar = (typeof SUITS)[number];

export const DECK: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

export const rankOf = (card: Card): number => card >> 2;
export const suitOf = (card: Card): number => card & 3;

export const makeCard = (rank: number, suit: number): Card => (rank << 2) | suit;

export function rankIndex(char: string): number {
  const idx = RANKS.indexOf(char.toUpperCase() as RankChar);
  if (idx === -1) throw new Error(`Rango inválido: "${char}"`);
  return idx;
}

export function suitIndex(char: string): number {
  const idx = SUITS.indexOf(char.toLowerCase() as SuitChar);
  if (idx === -1) throw new Error(`Palo inválido: "${char}"`);
  return idx;
}

/** "As" | "Th" | "2c" → Card */
export function parseCard(text: string): Card {
  const clean = text.trim();
  if (clean.length !== 2) throw new Error(`Carta inválida: "${text}"`);
  return makeCard(rankIndex(clean[0]), suitIndex(clean[1]));
}

/** "AsKd" | "As Kd" | "As,Kd" → Card[] */
export function parseCards(text: string): Card[] {
  const tokens = text.match(/[2-9TJQKAtjqka][cdhs]/g) ?? [];
  return tokens.map(parseCard);
}

export const formatCard = (card: Card): string => RANKS[rankOf(card)] + SUITS[suitOf(card)];
export const prettyCard = (card: Card): string => RANKS[rankOf(card)] + SUIT_SYMBOLS[suitOf(card)];

export const isRedSuit = (card: Card): boolean => suitOf(card) === 1 || suitOf(card) === 2;

/** true si hay cartas repetidas en la lista. */
export function hasDuplicates(cards: readonly Card[]): boolean {
  const seen = new Set<Card>();
  for (const card of cards) {
    if (seen.has(card)) return true;
    seen.add(card);
  }
  return false;
}

/** Baraja sin las cartas indicadas (las conocidas: tu mano, el board...). */
export function deckWithout(used: readonly Card[]): Card[] {
  const blocked = new Set(used);
  const deck: Card[] = [];
  for (let card = 0; card < 52; card++) if (!blocked.has(card)) deck.push(card);
  return deck;
}
