/**
 * Rangos preflop de referencia para mesa de 9 jugadores con 60bb o más.
 *
 * Base: la guía de open-raise de PokerStars incluida en `assets/PokerStars_PFR_PDF_EN.pdf`,
 * ajustada a los rangos estándar de 9-max que aparecen en la literatura moderna
 * (Clarke, "The Grinder's Manual"; Acevedo, "Modern Poker Theory").
 *
 * Aviso que repite el propio PDF y que la web muestra en pantalla: esto NO es una
 * chuleta cerrada. Es la línea de salida. Se ajusta según tu stack, el stack de los
 * rivales y cómo juegan.
 */

import { expandRange, rangePercent, type HandCode } from "./notation";

export const POSITIONS = ["UTG", "UTG+1", "UTG+2", "LJ", "HJ", "CO", "BTN", "SB", "BB"] as const;
export type Position = (typeof POSITIONS)[number];

export type Action = "raise" | "3bet" | "call" | "fold";

export interface PositionInfo {
  position: Position;
  /** Nombre largo en español. */
  name: string;
  zone: "Temprana" | "Media" | "Tardía" | "Ciegas";
  /** Una frase: qué significa jugar desde aquí. */
  idea: string;
  /** Manos con las que abres el bote si nadie ha subido. Las ciegas grandes no abren. */
  open?: string;
  /** Manos con las que resubes cuando alguien ya ha subido delante. */
  threeBet: string;
  /** Solo BB: manos con las que igualas el open del botón (ya has puesto la ciega). */
  call?: string;
}

export const POSITION_TABLE: Record<Position, PositionInfo> = {
  UTG: {
    position: "UTG",
    name: "Under the gun",
    zone: "Temprana",
    idea: "Hablas primero y quedan 8 jugadores por detrás. Cualquiera puede tener una mano mejor: abre poco y fuerte.",
    open: "66+, ATs+, KTs+, QJs, JTs, AQo+",
    threeBet: "QQ+, AKs, AKo, A5s",
  },
  "UTG+1": {
    position: "UTG+1",
    name: "Under the gun +1",
    zone: "Temprana",
    idea: "Casi idéntico a UTG. Un jugador menos por detrás no cambia gran cosa.",
    open: "66+, A9s+, KTs+, QJs, JTs, T9s, AJo+",
    threeBet: "QQ+, AKs, AKo, A5s",
  },
  "UTG+2": {
    position: "UTG+2",
    name: "Under the gun +2",
    zone: "Temprana",
    idea: "Empiezas a añadir manos especulativas que juegan bien en botes multiway.",
    open: "55+, A8s+, K9s+, QTs+, J9s+, T9s, 98s, AJo+, KQo",
    threeBet: "JJ+, AQs+, AKo, A5s-A4s",
  },
  LJ: {
    position: "LJ",
    name: "Lojack",
    zone: "Media",
    idea: "Quedan cinco por detrás. Abres más, pero aún respetas a los que faltan por hablar.",
    open: "44+, A7s+, K9s+, Q9s+, J9s+, T8s+, 98s, 87s, ATo+, KJo+",
    threeBet: "JJ+, AQs+, AKo, A5s-A4s",
  },
  HJ: {
    position: "HJ",
    name: "Hijack",
    zone: "Media",
    idea: "Suited aces y conectores entran en el rango: robar las ciegas ya es un objetivo real.",
    open: "33+, A2s+, K8s+, Q9s+, J8s+, T8s+, 97s+, 87s, 76s, 65s, ATo+, KJo+, QJo",
    threeBet: "TT+, AQs+, AKo, A5s-A4s, KQs",
  },
  CO: {
    position: "CO",
    name: "Cutoff",
    zone: "Tardía",
    idea: "Solo el botón y las ciegas por detrás. Abres ancho para llevarte los botes sin pelea.",
    open: "22+, A2s+, K5s+, Q8s+, J8s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A9o+, KTo+, QTo+, JTo",
    threeBet: "TT+, AJs+, KQs, AKo, AQo, A5s-A4s",
  },
  BTN: {
    position: "BTN",
    name: "Botón",
    zone: "Tardía",
    idea: "La mejor posición de la mesa: juegas último toda la mano. Es tu posición más rentable con diferencia.",
    open: "22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o",
    threeBet: "99+, ATs+, KJs+, QJs, AJo+, KQo, A5s-A2s",
  },
  SB: {
    position: "SB",
    name: "Ciega pequeña",
    zone: "Ciegas",
    idea: "Ya has puesto dinero, pero jugarás toda la mano fuera de posición. Sube o tira: igualar aquí es una fuga clásica.",
    open: "22+, A2s+, K3s+, Q6s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A4o+, K9o+, Q9o+, JTo, T9o",
    threeBet: "99+, AJs+, KQs, AQo+, A5s-A3s",
  },
  BB: {
    position: "BB",
    name: "Ciega grande",
    zone: "Ciegas",
    idea: "Nunca abres: si nadie sube, ves el flop gratis. Tu trabajo es defender la ciega que ya pusiste sin pasarte.",
    threeBet: "TT+, AJs+, KQs, AQo+, A5s-A2s",
    call: "22+, A2s+, K5s+, Q7s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A7o+, K9o+, Q9o+, J9o+, T9o, 98o",
  },
};

export const POSITION_LIST: PositionInfo[] = POSITIONS.map((p) => POSITION_TABLE[p]);

/** Posiciones que pueden abrir el bote (todas menos BB). */
export const OPENING_POSITIONS = POSITION_LIST.filter((p) => p.open).map((p) => p.position);

const cache = new Map<string, Set<HandCode>>();

function expandCached(notation: string): Set<HandCode> {
  let hands = cache.get(notation);
  if (!hands) {
    hands = expandRange(notation);
    cache.set(notation, hands);
  }
  return hands;
}

export type RangeKind = "open" | "threeBet" | "call";

/* -------------------------------------------------------------- tamaño de mesa */

export const TABLE_SIZES = [9, 8, 7, 6, 5, 4, 3, 2] as const;
export type TableSize = (typeof TABLE_SIZES)[number];
export const DEFAULT_TABLE_SIZE: TableSize = 9;

export const TABLE_LABELS: Record<TableSize, string> = {
  9: "9 · Full ring",
  8: "8 jugadores",
  7: "7 jugadores",
  6: "6 · 6-max",
  5: "5 jugadores",
  4: "4 jugadores",
  3: "3 · Mesa corta",
  2: "2 · Heads-up",
};

/** Las sillas en orden de acción preflop. Al quitar jugadores desaparecen por delante. */
const SEAT_ORDER: Position[] = [
  "UTG",
  "UTG+1",
  "UTG+2",
  "LJ",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
];

/**
 * Sillas que existen en una mesa de N jugadores.
 *
 * Al quitar gente desaparecen las sillas más tempranas, pero primero se van los
 * "UTG+n" para que el primero en hablar se siga llamando UTG, que es como se
 * dice en la mesa. Por debajo de 7 ya no quedan y la primera pasa a ser el
 * lojack (con el alias "(UTG)" en pantalla).
 * En heads-up no hay ciega pequeña aparte: el botón la pone.
 */
export function positionsFor(size: TableSize): Position[] {
  if (size === 2) return ["BTN", "BB"];
  if (size === 8) return SEAT_ORDER.filter((seat) => seat !== "UTG+2");
  if (size === 7) return SEAT_ORDER.filter((seat) => seat !== "UTG+1" && seat !== "UTG+2");
  return SEAT_ORDER.slice(SEAT_ORDER.length - size);
}

/** Jugadores que todavía tienen que hablar detrás de ti si abres el bote. */
export function seatsBehind(position: Position, size: TableSize = DEFAULT_TABLE_SIZE): number {
  const seats = positionsFor(size);
  const index = seats.indexOf(position);
  if (index === -1) return 0;
  return seats.length - 1 - index;
}

/**
 * De cuántos jugadores por detrás sale cada rango.
 * Ésta es la idea de fondo: una mesa de 6 no cambia el juego porque sea de 6,
 * sino porque desde la primera silla ya solo quedan 5 por hablar. Por eso el
 * primero en hablar en 6-max abre como el lojack de una mesa de 9.
 */
const SEAT_BY_BEHIND: Record<number, Position> = {
  8: "UTG",
  7: "UTG+1",
  6: "UTG+2",
  5: "LJ",
  4: "HJ",
  3: "CO",
  2: "BTN",
  1: "SB",
};

/** Heads-up: el botón juega en posición contra un solo rival, así que abre casi todo. */
const HEADS_UP = {
  open:
    "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 72s+, 62s+, 52s+, 42s+, 32s, " +
    "A2o+, K2o+, Q4o+, J6o+, T6o+, 96o+, 86o+, 75o+, 65o, 54o",
  threeBet: "44+, A2s+, K7s+, Q9s+, JTs, A7o+, KTo+, QJo",
  call: "22+, A2s+, K2s+, Q2s+, J4s+, T5s+, 95s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K5o+, Q8o+, J8o+, T8o+, 97o+, 87o, 76o, 65o",
};

/** Silla de referencia cuyos rangos se aplican a esta posición en esta mesa. */
function referenceSeat(position: Position, size: TableSize): Position {
  if (position === "BB") return "BB";
  return SEAT_BY_BEHIND[seatsBehind(position, size)] ?? position;
}

/** La notación literal del rango, ya resuelta para ese tamaño de mesa. */
export function notationFor(
  position: Position,
  kind: RangeKind,
  size: TableSize = DEFAULT_TABLE_SIZE,
): string | undefined {
  if (size === 2) {
    if (position === "BTN") return kind === "open" ? HEADS_UP.open : undefined;
    if (position === "BB") {
      return kind === "threeBet" ? HEADS_UP.threeBet : kind === "call" ? HEADS_UP.call : undefined;
    }
  }
  return POSITION_TABLE[referenceSeat(position, size)][kind];
}

/**
 * Nombre alternativo de la silla en mesas cortas: en 6-max al lojack se le
 * llama UTG porque es el primero en hablar, y en heads-up el botón es la SB.
 */
export function aliasFor(position: Position, size: TableSize): string | null {
  if (size === 2 && position === "BTN") return "BTN/SB";
  const seats = positionsFor(size);
  if (seats[0] === position && position !== "UTG") return `${position} (UTG)`;
  return null;
}

/* ------------------------------------------------------------------- consultas */

export function rangeFor(
  position: Position,
  kind: RangeKind,
  size: TableSize = DEFAULT_TABLE_SIZE,
): Set<HandCode> {
  const notation = notationFor(position, kind, size);
  return notation ? expandCached(notation) : new Set<HandCode>();
}

/**
 * Qué hacer con una mano concreta.
 * En modo "open": subes las manos del rango de apertura y tiras el resto.
 * En modo "3bet": resubes las del rango de 3-bet, igualas las de call y tiras el resto.
 */
export function actionFor(
  position: Position,
  hand: HandCode,
  kind: RangeKind = "open",
  size: TableSize = DEFAULT_TABLE_SIZE,
): Action {
  if (kind === "open") return rangeFor(position, "open", size).has(hand) ? "raise" : "fold";
  if (rangeFor(position, "threeBet", size).has(hand)) return "3bet";
  if (rangeFor(position, "call", size).has(hand)) return "call";
  return "fold";
}

export function percentFor(
  position: Position,
  kind: RangeKind,
  size: TableSize = DEFAULT_TABLE_SIZE,
): number {
  return rangePercent(rangeFor(position, kind, size));
}

/** Posiciones que pueden abrir el bote en una mesa de N (todas menos la ciega grande). */
export function openingPositionsFor(size: TableSize): Position[] {
  return positionsFor(size).filter((position) => rangeFor(position, "open", size).size > 0);
}
