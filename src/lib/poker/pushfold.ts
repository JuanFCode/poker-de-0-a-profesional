/**
 * Push o fold: los rangos de torneo cuando el stack es corto.
 *
 * Con 100 ciegas se abre a 2,5bb y se juega poker postflop. Con 10 hay una
 * decisión y solo una: todo dentro o a la basura. Subir 2,5bb con 10bb detrás
 * es comprometer un cuarto del stack sin fold equity, así que el all-in gana:
 * cobra las ciegas ahora y no deja jugar postflop a nadie.
 *
 * Las tablas son de EV en fichas (Nash sin ICM), redondeadas a lo que se puede
 * recordar en la mesa. La referencia no es la silla sino cuánta gente habla
 * detrás —igual que los rangos de cash del curso—, así que sirven para mesas
 * de 9, de 6 y de 4 sin tablas aparte.
 *
 * No es un solver ni una calculadora en vivo: es la tabla del curso para
 * estudiar los spots y repasarlos después de la sesión.
 */

import { expandRange, rangePercent, type HandCode } from "./notation";
import { seatsBehind, type Position, type TableSize } from "./ranges";

/** Los stacks (en ciegas grandes) para los que hay tabla escrita. */
export const SHOVE_ANCHORS = [6, 8, 12, 16] as const;
export const RESHOVE_ANCHORS = [12, 16, 20, 25] as const;

export type ShoveAnchor = (typeof SHOVE_ANCHORS)[number];
export type ReshoveAnchor = (typeof RESHOVE_ANCHORS)[number];

/** Hasta dónde llega el push/fold y qué manda en cada tramo. */
export type StackZone = "empujar" | "mixto" | "resubir" | "profundo";

export interface ZoneInfo {
  zone: StackZone;
  headline: string;
  detail: string;
}

const ZONES: ZoneInfo[] = [
  {
    zone: "empujar",
    headline: "Push o fold puro",
    detail:
      "Con 10 ciegas o menos no hay postflop que jugar: subir pequeño compromete el stack sin " +
      "fold equity. Todo lo que juegues, entra all-in.",
  },
  {
    zone: "mixto",
    headline: "All-in desde las últimas sillas",
    detail:
      "De 11 a 15 ciegas el all-in sigue mandando en CO, BTN y SB. Desde las primeras sillas ya " +
      "se puede abrir a 2bb con las manos fuertes, pero con la mano media el all-in gana más.",
  },
  {
    zone: "resubir",
    headline: "Abres subiendo, resubes all-in",
    detail:
      "De 16 a 25 ciegas ya no se empuja de primeras salvo desde SB y BTN: se abre a 2-2,2bb. " +
      "El arma es la resubida all-in sobre la subida de otro, que es donde está tu fold equity.",
  },
  {
    zone: "profundo",
    headline: "Poker normal",
    detail:
      "Por encima de 25 ciegas hay sitio para jugar postflop: mandan los rangos de apertura y de " +
      "3-bet del curso, no estas tablas.",
  },
];

export const zoneFor = (stackBB: number): ZoneInfo =>
  stackBB <= 10 ? ZONES[0] : stackBB <= 15 ? ZONES[1] : stackBB <= 25 ? ZONES[2] : ZONES[3];

/* --------------------------------------------------------------- las tablas */

/**
 * All-in con el bote sin abrir, por gente que habla detrás.
 * 1 = ciega pequeña, 2 = botón, 3 = CO, 4 = HJ, 5 o más = las primeras sillas.
 */
const SHOVE: Record<number, Record<ShoveAnchor, string>> = {
  1: {
    6: "22+, A2s+, K2s+, Q2s+, J2s+, T4s+, 94s+, 84s+, 73s+, 63s+, 53s+, 43s, A2o+, K2o+, Q5o+, J6o+, T6o+, 96o+, 86o+, 75o+, 65o",
    8: "22+, A2s+, K2s+, Q2s+, J5s+, T6s+, 95s+, 85s+, 74s+, 64s+, 54s, A2o+, K4o+, Q7o+, J7o+, T7o+, 97o+, 87o, 76o",
    12: "22+, A2s+, K4s+, Q7s+, J8s+, T8s+, 97s+, 87s, 76s, A2o+, K8o+, Q9o+, J9o+, T9o",
    16: "22+, A2s+, K8s+, QTs+, JTs, T9s, A7o+, KTo+, QJo",
  },
  2: {
    6: "22+, A2s+, K2s+, Q2s+, J4s+, T5s+, 95s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K4o+, Q7o+, J7o+, T7o+, 96o+, 86o+, 76o",
    8: "22+, A2s+, K2s+, Q6s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A2o+, K7o+, Q8o+, J8o+, T8o+, 98o",
    12: "22+, A2s+, K6s+, Q8s+, J8s+, T8s+, 98s, 87s, A7o+, K9o+, QTo+, JTo",
    16: "22+, A4s+, K9s+, QTs+, JTs, A9o+, KJo+, QJo",
  },
  3: {
    6: "22+, A2s+, K2s+, Q6s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A2o+, K7o+, Q8o+, J8o+, T8o+, 98o",
    8: "22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 87s, 76s, A5o+, K9o+, Q9o+, J9o+, T9o",
    12: "22+, A2s+, K9s+, QTs+, JTs, T9s, A9o+, KJo+, QJo",
    16: "33+, A5s+, KTs+, QJs, ATo+, KQo",
  },
  4: {
    6: "22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 87s, 76s, A4o+, K9o+, Q9o+, J9o+, T9o",
    8: "22+, A2s+, K7s+, Q9s+, J9s+, T9s, 98s, A7o+, KTo+, QJo, JTo",
    12: "22+, A4s+, K9s+, QTs+, JTs, A9o+, KJo+, QJo",
    16: "44+, A7s+, A5s, KTs+, QJs, ATo+, KQo",
  },
  5: {
    6: "22+, A2s+, K7s+, Q9s+, J9s+, T9s, 98s, A7o+, KTo+, QJo, JTo",
    8: "22+, A2s+, K9s+, QTs+, JTs, T9s, A9o+, KJo+, QJo",
    12: "33+, A5s+, KTs+, QJs, JTs, ATo+, KQo",
    16: "55+, A8s+, A5s, KJs+, QJs, AJo+, KQo",
  },
};

/** De dónde viene el all-in que te toca pagar (o la subida que quieres resubir). */
export type RivalZone = "tardía" | "media" | "temprana";

export const RIVAL_ZONE_LABEL: Record<RivalZone, string> = {
  tardía: "botón o ciega pequeña",
  media: "CO o HJ",
  temprana: "primeras sillas",
};

/** Pagar un all-in. Siempre más cerrado que empujarlo: aquí no hay fold equity. */
const CALL: Record<RivalZone, Record<ShoveAnchor, string>> = {
  tardía: {
    6: "22+, A2s+, K4s+, Q7s+, J8s+, T8s+, 98s, 87s, A2o+, K7o+, Q9o+, J9o+, T9o",
    8: "22+, A2s+, K7s+, Q9s+, J9s+, T9s, A4o+, K9o+, QTo+, JTo",
    12: "22+, A2s+, K9s+, QTs+, JTs, A8o+, KTo+, QJo",
    16: "33+, A4s+, KTs+, QJs, ATo+, KJo+",
  },
  media: {
    6: "22+, A2s+, K7s+, Q9s+, J9s+, T9s, A5o+, K9o+, QTo+, JTo",
    8: "22+, A2s+, K9s+, QTs+, JTs, A8o+, KTo+, QJo",
    12: "33+, A4s+, KTs+, QJs, ATo+, KJo+",
    16: "55+, A8s+, A5s, KJs+, AJo+, KQo",
  },
  temprana: {
    6: "22+, A2s+, K9s+, QTs+, JTs, A8o+, KTo+, QJo",
    8: "22+, A5s+, KTs+, QJs, ATo+, KJo+",
    12: "44+, A8s+, A5s, KJs+, AJo+, KQo",
    16: "77+, ATs+, KQs, AQo+",
  },
};

/** Resubir all-in sobre la subida de otro: el arma de los 16-25bb. */
const RESHOVE: Record<RivalZone, Record<ReshoveAnchor, string>> = {
  tardía: {
    12: "22+, A2s+, K9s+, QTs+, JTs, A8o+, KTo+, QJo",
    16: "44+, A7s+, A5s, KTs+, QJs, ATo+, KJo+",
    20: "55+, A9s+, A5s, KJs+, QJs, AJo+, KQo",
    25: "77+, ATs+, KJs+, AQo+",
  },
  media: {
    12: "22+, A4s+, KTs+, QJs, JTs, A9o+, KJo+",
    16: "44+, A8s+, A5s, KJs+, QJs, AJo+, KQo",
    20: "66+, ATs+, KQs, AQo+, AJs",
    25: "88+, AJs+, AKo",
  },
  temprana: {
    12: "33+, A5s+, KTs+, QJs, ATo+, KJo+",
    16: "55+, A8s+, A5s, KJs+, AJo+, KQo",
    20: "77+, ATs+, KQs, AQo+",
    25: "99+, AJs+, AKo",
  },
};

/* ---------------------------------------------------------------- consultas */

/** El tramo escrito que se aplica a un stack: siempre el más corto que le sirve. */
const anchorFor = <T extends number>(anchors: readonly T[], stackBB: number): T =>
  anchors.find((value) => stackBB <= value) ?? anchors[anchors.length - 1];

/** La zona del rival por la silla desde la que entró. */
export function rivalZoneOf(position: Position, size: TableSize): RivalZone {
  const behind = seatsBehind(position, size);
  if (position === "SB" || behind <= 2) return "tardía";
  if (behind <= 4) return "media";
  return "temprana";
}

export interface PushFoldChart {
  /** El rango, en notación de siempre. */
  notation: string;
  hands: Set<HandCode>;
  /** Porcentaje de las 1326 combinaciones. */
  percent: number;
  /** Stack de la tabla que se ha usado, en ciegas. */
  anchor: number;
  label: string;
}

const chartFrom = (notation: string, anchor: number, label: string): PushFoldChart => {
  const hands = expandRange(notation);
  return { notation, hands, percent: rangePercent(hands), anchor, label };
};

/** Con qué manos entras all-in si nadie ha entrado antes. */
export function shoveChart(
  position: Position,
  size: TableSize,
  stackBB: number,
): PushFoldChart | null {
  // La ciega grande no empuja un bote sin abrir: si todos tiran, ya ha ganado.
  if (position === "BB") return null;
  const behind = Math.min(Math.max(seatsBehind(position, size), 1), 5);
  const anchor = anchorFor(SHOVE_ANCHORS, stackBB);
  return chartFrom(
    SHOVE[behind][anchor],
    anchor,
    `All-in desde ${position} con ${behind} ${behind === 1 ? "jugador" : "jugadores"} detrás`,
  );
}

/** Con qué manos pagas el all-in de otro. */
export function callChart(shover: Position, size: TableSize, stackBB: number): PushFoldChart {
  const zone = rivalZoneOf(shover, size);
  const anchor = anchorFor(SHOVE_ANCHORS, stackBB);
  return chartFrom(CALL[zone][anchor], anchor, `Pagar el all-in de ${shover}`);
}

/** Con qué manos resubes all-in sobre una subida. */
export function reshoveChart(opener: Position, size: TableSize, stackBB: number): PushFoldChart {
  const zone = rivalZoneOf(opener, size);
  const anchor = anchorFor(RESHOVE_ANCHORS, stackBB);
  return chartFrom(RESHOVE[zone][anchor], anchor, `Resubir all-in sobre la subida de ${opener}`);
}

/* ------------------------------------------------------------- los ajustes */

export interface Adjustment {
  title: string;
  detail: string;
}

/**
 * Lo que las tablas de fichas no saben. Se leen después de la tabla, nunca en
 * lugar de ella: primero el rango, luego el ajuste.
 */
export const ADJUSTMENTS: Adjustment[] = [
  {
    title: "Con bounty, pagas más ancho",
    detail:
      "Si te llevas su recompensa al ganar, el bote es mayor de lo que dice la mesa: cada all-in " +
      "que pagas te paga dos veces. Paga un tramo más ancho que la tabla cuando cubres al rival, " +
      "y no cambies nada cuando él te cubre a ti: ahí no hay recompensa que cobrar.",
  },
  {
    title: "Cerca de un premio, pagas más cerrado",
    detail:
      "Estas tablas son de fichas, y en un torneo las fichas que pierdes valen más que las que " +
      "ganas: quedarte fuera cuesta el premio entero. En la burbuja o antes de un salto de pago, " +
      "paga bastante más cerrado y empuja algo más ancho contra los que también tienen miedo.",
  },
  {
    title: "El stack que cuenta es el corto",
    detail:
      "Se mira el stack efectivo: el menor entre el tuyo y el del rival. Con 40 ciegas contra uno " +
      "que tiene 9, tu decisión es de 9 ciegas.",
  },
  {
    title: "Contra el que paga todo, empuja menos",
    detail:
      "Las tablas suponen rivales que tiran lo que tienen que tirar. Contra una estación de pago " +
      "el farol vale cero: empuja solo valor y espera. Contra el que tira demasiado, empuja todo.",
  },
];
