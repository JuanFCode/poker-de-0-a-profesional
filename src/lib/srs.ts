/**
 * Repetición espaciada con cajas de Leitner.
 *
 * Cada pregunta vive en una caja. Si aciertas sube una caja y tarda más en
 * volver; si fallas cae a la primera y vuelve enseguida. Es la forma barata de
 * estudiar solo lo que todavía no te sabes.
 */

export interface CardState {
  id: string;
  box: number;
  /** Momento (ms) a partir del cual toca repasarla. */
  due: number;
  seen: number;
  correct: number;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Espera de cada caja: al fallar vuelve en 1 minuto; la última, en tres semanas. */
export const BOX_DELAYS = [MINUTE, 10 * MINUTE, DAY, 3 * DAY, 7 * DAY, 21 * DAY];
export const MAX_BOX = BOX_DELAYS.length - 1;

export type DeckState = Record<string, CardState>;

export function newCard(id: string): CardState {
  return { id, box: 0, due: 0, seen: 0, correct: 0 };
}

export function review(card: CardState, correct: boolean, now: number = Date.now()): CardState {
  const box = correct ? Math.min(card.box + 1, MAX_BOX) : 0;
  return {
    id: card.id,
    box,
    due: now + BOX_DELAYS[box],
    seen: card.seen + 1,
    correct: card.correct + (correct ? 1 : 0),
  };
}

export function applyReview(
  deck: DeckState,
  id: string,
  correct: boolean,
  now: number = Date.now(),
): DeckState {
  const card = deck[id] ?? newCard(id);
  return { ...deck, [id]: review(card, correct, now) };
}

/**
 * Siguiente pregunta: primero las que nunca has visto, luego las vencidas
 * (la más atrasada primero) y, si no queda nada pendiente, la que antes vuelva.
 */
export function nextCardId(deck: DeckState, ids: string[], now: number = Date.now()): string | null {
  if (ids.length === 0) return null;

  const unseen = ids.filter((id) => !deck[id]);
  if (unseen.length > 0) return unseen[0];

  const due = ids.filter((id) => deck[id].due <= now).sort((a, b) => deck[a].due - deck[b].due);
  if (due.length > 0) return due[0];

  return [...ids].sort((a, b) => deck[a].due - deck[b].due)[0];
}

export interface DeckStats {
  total: number;
  studied: number;
  mastered: number;
  dueNow: number;
  accuracy: number;
}

export function deckStats(deck: DeckState, ids: string[], now: number = Date.now()): DeckStats {
  let studied = 0;
  let mastered = 0;
  let dueNow = 0;
  let seen = 0;
  let correct = 0;

  for (const id of ids) {
    const card = deck[id];
    if (!card) {
      dueNow++;
      continue;
    }
    studied++;
    seen += card.seen;
    correct += card.correct;
    if (card.box >= MAX_BOX) mastered++;
    if (card.due <= now) dueNow++;
  }

  return {
    total: ids.length,
    studied,
    mastered,
    dueNow,
    accuracy: seen === 0 ? 0 : correct / seen,
  };
}
