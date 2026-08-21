/**
 * Equity: qué porcentaje del bote te corresponde a largo plazo.
 *
 * Cuando faltan pocas cartas por salir y todas las manos son conocidas se
 * enumeran todos los casos (resultado exacto). Si no, se simula por Monte Carlo,
 * que con 50.000 manos deja un error de unas décimas — de sobra para decidir.
 */

import { deckWithout, makeCard, type Card } from "./cards";
import { evaluate } from "./evaluator";
import { type HandCode } from "./notation";
import { createRandom } from "./random";
import { rankIndex } from "./cards";

export type Opponent =
  | { kind: "cards"; cards: Card[] }
  | { kind: "range"; hands: HandCode[] }
  | { kind: "random" };

export interface EquityInput {
  hero: Card[];
  opponents: Opponent[];
  board?: Card[];
  iterations?: number;
  seed?: number;
}

export interface PlayerEquity {
  /** Fracción de manos ganadas en solitario. */
  win: number;
  /** Fracción de manos empatadas (repartidas con el resto). */
  tie: number;
  /** win + parte proporcional de los empates: lo que de verdad te llevas. */
  equity: number;
}

export interface EquityResult {
  hero: PlayerEquity;
  opponents: PlayerEquity[];
  iterations: number;
  exact: boolean;
}

/** Las combinaciones concretas de una mano en notación ("AKs" → 4 combos). */
export function handCombos(hand: HandCode): [Card, Card][] {
  const high = rankIndex(hand[0]);
  const low = rankIndex(hand[1]);
  const combos: [Card, Card][] = [];
  if (hand.length === 2) {
    for (let a = 0; a < 4; a++) {
      for (let b = a + 1; b < 4; b++) combos.push([makeCard(high, a), makeCard(low, b)]);
    }
    return combos;
  }
  if (hand.endsWith("s")) {
    for (let suit = 0; suit < 4; suit++) combos.push([makeCard(high, suit), makeCard(low, suit)]);
    return combos;
  }
  for (let sa = 0; sa < 4; sa++) {
    for (let sb = 0; sb < 4; sb++) {
      if (sa !== sb) combos.push([makeCard(high, sa), makeCard(low, sb)]);
    }
  }
  return combos;
}

function tally(scores: number[], wins: number[], ties: number[], shares: number[]): void {
  let best = -1;
  let winners = 0;
  for (const score of scores) {
    if (score > best) {
      best = score;
      winners = 1;
    } else if (score === best) {
      winners++;
    }
  }
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] !== best) continue;
    if (winners === 1) wins[i]++;
    else ties[i]++;
    shares[i] += 1 / winners;
  }
}

export function calculateEquity(input: EquityInput): EquityResult {
  const { hero, opponents, board = [], seed = 0x1234567 } = input;
  const iterations = input.iterations ?? 50_000;
  const players = 1 + opponents.length;

  const known: Card[] = [...hero, ...board];
  for (const opponent of opponents) if (opponent.kind === "cards") known.push(...opponent.cards);

  const rangeCombos = opponents.map((opponent) =>
    opponent.kind === "range" ? opponent.hands.flatMap(handCombos) : null,
  );

  const boardNeeded = 5 - board.length;
  const allKnown = opponents.every((o) => o.kind === "cards");
  const deck = deckWithout(known);

  const wins = new Array<number>(players).fill(0);
  const ties = new Array<number>(players).fill(0);
  const shares = new Array<number>(players).fill(0);
  const scores = new Array<number>(players).fill(0);

  const holeCards: Card[][] = opponents.map(() => []);

  const scoreShowdown = (runout: Card[]) => {
    const community = [...board, ...runout];
    scores[0] = evaluate([...hero, ...community]);
    for (let i = 0; i < opponents.length; i++) {
      const opponent = opponents[i];
      const cards = opponent.kind === "cards" ? opponent.cards : holeCards[i];
      scores[i + 1] = evaluate([...cards, ...community]);
    }
    tally(scores, wins, ties, shares);
  };

  // Caso barato: todo conocido y faltan 2 cartas o menos -> enumeración exacta.
  if (allKnown && boardNeeded <= 2) {
    let count = 0;
    if (boardNeeded === 0) {
      scoreShowdown([]);
      count = 1;
    } else if (boardNeeded === 1) {
      for (const card of deck) {
        scoreShowdown([card]);
        count++;
      }
    } else {
      for (let i = 0; i < deck.length; i++) {
        for (let j = i + 1; j < deck.length; j++) {
          scoreShowdown([deck[i], deck[j]]);
          count++;
        }
      }
    }
    return finish(wins, ties, shares, count, true);
  }

  const random = createRandom(seed);
  const pool = deck.slice();
  const used = new Set<Card>();
  let completed = 0;

  for (let iteration = 0; iteration < iterations; iteration++) {
    used.clear();
    let valid = true;

    for (let i = 0; i < opponents.length && valid; i++) {
      const combos = rangeCombos[i];
      if (combos === null && opponents[i].kind === "cards") continue;

      let assigned: [Card, Card] | null = null;
      for (let attempt = 0; attempt < 40 && !assigned; attempt++) {
        const candidate: [Card, Card] = combos
          ? combos[Math.floor(random() * combos.length)]
          : [pool[Math.floor(random() * pool.length)], pool[Math.floor(random() * pool.length)]];
        if (candidate[0] === candidate[1]) continue;
        if (known.includes(candidate[0]) || known.includes(candidate[1])) continue;
        if (used.has(candidate[0]) || used.has(candidate[1])) continue;
        assigned = candidate;
      }
      if (!assigned) {
        valid = false;
        break;
      }
      used.add(assigned[0]);
      used.add(assigned[1]);
      holeCards[i] = assigned;
    }

    if (!valid) continue;

    // Fisher-Yates parcial sobre las cartas libres para completar el board.
    const runout: Card[] = [];
    const available = pool.filter((card) => !used.has(card));
    for (let n = 0; n < boardNeeded; n++) {
      const pick = n + Math.floor(random() * (available.length - n));
      const card = available[pick];
      available[pick] = available[n];
      available[n] = card;
      runout.push(card);
    }

    scoreShowdown(runout);
    completed++;
  }

  return finish(wins, ties, shares, completed, false);
}

function finish(
  wins: number[],
  ties: number[],
  shares: number[],
  count: number,
  exact: boolean,
): EquityResult {
  const total = count || 1;
  const toPlayer = (i: number): PlayerEquity => ({
    win: wins[i] / total,
    tie: ties[i] / total,
    equity: shares[i] / total,
  });
  return {
    hero: toPlayer(0),
    opponents: wins.slice(1).map((_, i) => toPlayer(i + 1)),
    iterations: count,
    exact,
  };
}
