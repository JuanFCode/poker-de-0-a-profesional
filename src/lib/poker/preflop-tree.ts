/**
 * El árbol preflop completo: qué pasa *después* de que alguien abra el bote.
 *
 * `ranges.ts` cubre la primera capa —con qué abres si nadie ha subido—. Aquí
 * están las tres que faltaban:
 *
 *   1. te han subido delante        -> `VS_OPEN`
 *   2. abriste y te resuben         -> `VS_3BET`
 *   3. resubiste y te vuelven a subir -> `VS_4BET`
 *
 * Base: los charts gratuitos de cash en vivo de Jonathan Little
 * (pokercoaching.com/charts), presentados en "The NEW Preflop Strategy I Use to
 * Crush $1/$2 & $2/$5 Cash Games". Son charts de 8 jugadores, 100bb y con
 * rastrillo, no charts de GTO: están pensados para poder jugarse de memoria.
 *
 * Dos ideas recorren todas las tablas y explican casi cada casilla:
 *
 * - **Dominación.** Contra un rango que ya ha enseñado fuerza, A-10s no es una
 *   mano jugable: cuando ligas pareja de ases, su as es mejor. 9-8s vale más
 *   que A-10s en ese sitio aunque "parezca" peor mano.
 * - **Suited manda.** K-8s se abre desde posición temprana; K-8o no se abre ni
 *   desde el botón. El color no es solo equity: es una calle más de farol.
 */

import { expandRange, rangePercent, type HandCode } from "./notation";
import {
  positionsFor,
  rangeFor,
  type Action,
  type Position,
  type TableSize,
  DEFAULT_TABLE_SIZE,
} from "./ranges";

/* ------------------------------------------------------------------- zonas */

/** Las cuatro zonas de la mesa. Lo que decide el rango es la zona, no la silla exacta. */
export type Zone = "temprana" | "media" | "tardia" | "ciegas";

export const ZONE_LABEL: Record<Zone, string> = {
  temprana: "posición temprana",
  media: "posición media",
  tardia: "posición tardía",
  ciegas: "las ciegas",
};

const ZONE_OF: Record<Position, Zone> = {
  UTG: "temprana",
  "UTG+1": "temprana",
  "UTG+2": "temprana",
  LJ: "media",
  HJ: "media",
  CO: "tardia",
  BTN: "tardia",
  SB: "ciegas",
  BB: "ciegas",
};

export const zoneOf = (seat: Position): Zone => ZONE_OF[seat];

const cache = new Map<string, Set<HandCode>>();

function expandCached(notation: string): Set<HandCode> {
  let hands = cache.get(notation);
  if (!hands) {
    hands = expandRange(notation);
    cache.set(notation, hands);
  }
  return hands;
}

/* --------------------------------------------------- 1. alguien ya ha subido */

export interface Defense {
  /** Con qué resubes. Mitad valor, mitad farol con blockers. */
  threeBet: string;
  /** Con qué igualas y ves el flop. */
  call: string;
  /** Una frase: por qué el rango es así de ancho o así de cerrado. */
  nota: string;
}

/**
 * Cómo juegas cuando alguien sube antes que tú, por zona del que sube.
 *
 * Regla de fondo: cuanto más temprano sube, más fuerte es su rango y menos
 * juegas tú. Y cuanta más gente quede por hablar detrás de ti, menos también:
 * alguno acabará despertando con una mano de verdad.
 */
export const VS_OPEN: Record<Zone, Partial<Record<Position, Defense>>> = {
  temprana: {
    "UTG+1": {
      threeBet: "QQ+, AKs, AKo, A5s",
      call: "JJ-99, AQs, AJs, KQs, JTs",
      nota: "El sitio más incómodo de la mesa: rango fortísimo delante y seis jugadores por detrás. Aquí se tira casi todo.",
    },
    "UTG+2": {
      threeBet: "QQ+, AKs, AKo, A5s-A4s",
      call: "JJ-88, AQs, AJs, KQs, QJs, JTs",
      nota: "Un jugador menos por detrás no cambia gran cosa: sigues abriendo la mano contra el rango más fuerte que existe.",
    },
    LJ: {
      threeBet: "QQ+, AKs, AKo, A5s-A4s",
      call: "JJ-77, AQs, AJs, ATs, KQs, QJs, JTs, T9s",
      nota: "Empiezan a entrar los suited que juegan bien postflop, pero nada offsuit fuera de A-Q.",
    },
    HJ: {
      threeBet: "QQ+, AKs, AKo, A5s-A4s, KQs",
      call: "JJ-66, AQs, AJs, ATs, KJs, QJs, JTs, T9s, 98s",
      nota: "Cinco por detrás todavía. K-Qs pasa a resubir: bloquea K-K y A-K, que es justo lo que te resubiría.",
    },
    CO: {
      threeBet: "QQ+, AKs, AKo, A5s-A3s, KQs, KJs",
      call: "JJ-55, AQs, AJs, ATs, A9s, QJs, QTs, JTs, T9s, 98s, 87s",
      nota: "Solo el botón y las ciegas por detrás: puedes pagar más porque te van a resubir menos.",
    },
    BTN: {
      threeBet: "JJ+, AKs, AKo, AQs, A5s-A3s, KQs, KJs",
      call: "TT-22, AJs, ATs, A9s-A8s, QJs, QTs, JTs, J9s, T9s, 98s, 87s, 76s, AQo",
      nota: "Nadie habla después de ti: juegas todas las calles en posición, y eso vale más que cualquier carta alta suelta.",
    },
    SB: {
      threeBet: "QQ+, AKs, AKo, AQs, A5s-A4s, KQs",
      call: "JJ-99",
      nota: "Medio ciega de descuento no paga jugar toda la mano fuera de posición contra un rango fortísimo. Resubes o tiras.",
    },
    BB: {
      threeBet: "QQ+, AKs, AKo, AQs, A5s-A4s, KQs",
      call: "JJ-22, AJs, ATs, KJs, QJs, JTs, T9s, 98s, 87s, 76s, 65s, AQo, AJo, KQo",
      nota: "Ya tienes 1bb dentro y te dan el mejor precio de la mesa. Aun así, contra una apertura temprana no es sitio para inventar.",
    },
  },
  media: {
    HJ: {
      threeBet: "QQ+, AKs, AKo, A5s-A4s, KQs",
      call: "JJ-88, AQs, AJs, ATs, QJs, JTs, T9s",
      nota: "Su rango ya no es de hierro, pero tú sigues teniendo cinco jugadores por detrás.",
    },
    CO: {
      threeBet: "JJ+, AKs, AKo, AQs, A5s-A3s, KQs, KJs",
      call: "TT-66, AJs, ATs, A9s, QJs, QTs, JTs, T9s, 98s, 87s, AQo",
      nota: "Empieza a compensar resubir por presión: si el botón no resube casi nunca, puedes pagar todavía más ancho.",
    },
    BTN: {
      threeBet: "JJ+, AKs, AKo, AQs, A5s-A3s, KQs, KJs, QJs",
      call: "TT-22, AJs, ATs, A9s-A6s, QTs, JTs, J9s, T9s, T8s, 98s, 87s, 76s, 65s, AQo, AJo",
      nota: "La silla que más dinero gana de la mesa, y este es el escenario en el que la gana.",
    },
    SB: {
      threeBet: "JJ+, AKs, AKo, AQs, AQo, A5s-A3s, KQs, KJs",
      call: "TT-77, AJs, ATs, QJs, JTs",
      nota: "Sigues fuera de posición y con la BB por detrás. Con rastrillo, llevarte el bote antes del flop es no pagar rastrillo.",
    },
    BB: {
      threeBet: "JJ+, AKs, AKo, AQs, A5s-A2s, KQs, KJs",
      call: "TT-22, AJs, ATs, A9s-A6s, QJs, QTs, Q9s, JTs, J9s, T9s, T8s, 98s, 97s, 87s, 76s, 65s, 54s, AQo, AJo, KQo, KJo, QJo, JTo",
      nota: "Aquí el precio ya justifica ver muchos flops, siempre que sean manos que ligan botes y no cartas altas sueltas.",
    },
  },
  tardia: {
    BTN: {
      threeBet: "TT+, AKs, AKo, AQs, AQo, AJs, A5s-A2s, KQs, KJs",
      call: "99-22, ATs-A6s, QJs, QTs, Q9s, JTs, J9s, T9s, T8s, 98s, 97s, 87s, 76s, 65s, 54s, AJo, KQo",
      nota: "El cutoff abre ancho y tú tienes posición sobre él el resto de la mano. Este es el sitio donde más se resube de toda la mesa.",
    },
    SB: {
      threeBet: "TT+, AKs, AKo, AQs, AQo, AJs, A5s-A2s, KQs, KJs, QJs",
      call: "99-66, ATs, A9s, JTs, T9s",
      nota: "Casi todo es resubir o tirar. Si el que abre juega mal y la BB juega bien, resube más ancho todavía: quieres quedarte a solas con el malo.",
    },
    BB: {
      threeBet: "TT+, AKs, AKo, AQs, AJs, A5s-A2s, KQs, KJs",
      call: "99-22, ATs-A6s, QJs-Q8s, JTs-J8s, T9s-T8s, 98s-97s, 87s, 76s, 65s, 54s, AJo, ATo, KQo, KJo, KTo, QJo, QTo, JTo, T9o",
      nota: "Contra un botón que abre el 40% defiendes muchísimo. Aun así el offsuit suelto sigue fuera: el precio es bueno para manos que ligan, no para K-4o.",
    },
  },
  ciegas: {
    BB: {
      threeBet: "99+, AKs, AKo, AQs, AQo, AJs, ATs, A5s-A2s, KQs, KJs, KQo",
      call: "88-22, A9s-A6s, KTs-K8s, QJs-Q8s, JTs-J8s, T9s-T8s, 98s-97s, 87s, 76s, 65s, 54s, AJo, ATo, A9o, KJo, KTo, QJo, QTo, JTo, T9o, 98o",
      nota: "Cara a cara y con el mejor precio del juego. Es la única situación en la que defender casi todo es correcto.",
    },
  },
};

/** Orden en el que se habla preflop. Solo defiendes contra quien habla antes que tú. */
const ACTION_ORDER: Position[] = [
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

/** ¿`hero` habla después de `opener`? Si no, la situación no existe. */
export const actsAfter = (hero: Position, opener: Position): boolean =>
  ACTION_ORDER.indexOf(hero) > ACTION_ORDER.indexOf(opener);

/** El plan contra una subida: quién sube decide cuánto juegas tú. */
export function defenseFor(hero: Position, opener: Position): Defense | null {
  if (!actsAfter(hero, opener)) return null;
  return VS_OPEN[zoneOf(opener)][hero] ?? null;
}

/** Sillas desde las que tiene sentido responder a una subida de `opener`. */
export function defendersAgainst(
  opener: Position,
  size: TableSize = DEFAULT_TABLE_SIZE,
): Position[] {
  const seats = new Set(positionsFor(size));
  return (Object.keys(VS_OPEN[zoneOf(opener)]) as Position[]).filter(
    (seat) => seats.has(seat) && actsAfter(seat, opener),
  );
}

/** Sillas que pueden haber subido antes de que hables tú desde `hero`. */
export function openersAgainst(
  hero: Position,
  size: TableSize = DEFAULT_TABLE_SIZE,
): Position[] {
  return positionsFor(size).filter((seat) => defenseFor(hero, seat) !== null);
}

/** Sillas que pueden resubirte cuando abres desde `hero`. */
export function threeBettorsAgainst(
  hero: Position,
  size: TableSize = DEFAULT_TABLE_SIZE,
): Position[] {
  return positionsFor(size).filter(
    (seat) => actsAfter(seat, hero) && responseTo3Bet(hero, seat) !== null,
  );
}

export function actionVsOpen(hero: Position, opener: Position, hand: HandCode): Action {
  const defense = defenseFor(hero, opener);
  if (!defense) return "fold";
  if (expandCached(defense.threeBet).has(hand)) return "3bet";
  if (expandCached(defense.call).has(hand)) return "call";
  return "fold";
}

/* ------------------------------------------------------ 2. abriste y te resuben */

export interface Response3Bet {
  /** Con qué vuelves a subir. */
  fourBet: string;
  /** Con qué igualas y ves el flop en un bote de 3-bet. */
  call: string;
  nota: string;
}

/**
 * Abriste el bote y alguien resube. Clave: `[tu zona][zona del que resube]`.
 *
 * El error más caro y más repetido de límites bajos vive aquí: 4-betear Q-Q y
 * J-J contra un 3-bet de posición temprana. Cuando entra el dinero vas contra
 * A-A, K-K o Q-Q —dominado— o contra A-K, que es moneda al aire. No hay premio.
 */
export const VS_3BET: Record<Zone, Partial<Record<Zone, Response3Bet>>> = {
  temprana: {
    temprana: {
      fourBet: "AA, KK, AKs, AKo",
      call: "QQ-99, AQs, 98s, 87s, 76s, 65s",
      nota: "Subida temprana contra resubida temprana: dos jugadores han anunciado mano. Q-Q y J-J igualan, no resuben. K-Qs y A-10s se tiran: van dominadas por todo lo que continúa.",
    },
    media: {
      fourBet: "AA, KK, AKs, AKo",
      call: "QQ-99, AQs, AJs, 98s, 87s, 76s",
      nota: "Su rango sigue siendo de valor. Los suited conectores juegan mejor que los broadways offsuit porque no están dominados.",
    },
    tardia: {
      fourBet: "AA, KK, QQ, AKs, AKo, A5s",
      call: "JJ-88, AQs, AJs, KQs, 98s, 87s, 76s, 65s",
      nota: "Desde posición tardía sí resuben con faroles, así que Q-Q vuelve a ser un 4-bet por valor.",
    },
    ciegas: {
      fourBet: "AA, KK, AKs, AKo, A5s",
      call: "QQ-99, AQs, AJs, KQs, 98s, 87s, 76s",
      nota: "Desde las ciegas resuben más grande para quitarte la posición. Peor precio, rango más cerrado.",
    },
  },
  media: {
    media: {
      fourBet: "AA, KK, QQ, AKs, AKo, A5s",
      call: "JJ-99, AQs, AJs, KQs, 98s, 87s, 76s",
      nota: "Rangos algo más anchos por los dos lados, pero la jerarquía no cambia.",
    },
    tardia: {
      fourBet: "AA, KK, QQ, AKs, AKo, A5s-A4s",
      call: "JJ-88, AQs, AJs, ATs, KQs, QJs, JTs, T9s, 98s, 87s, 76s",
      nota: "El botón resube ancho sobre las posiciones medias. Aquí ya puedes pagar con manos que ligan botes y devolver el 4-bet por valor.",
    },
    ciegas: {
      fourBet: "AA, KK, QQ, AKs, AKo, A5s-A4s",
      call: "JJ-88, AQs, AJs, ATs, KQs, KJs, QJs, JTs, T9s, 98s, 87s",
      nota: "Jugarás el bote en posición: puedes igualar bastante más de lo que parece.",
    },
  },
  tardia: {
    tardia: {
      fourBet: "AA, KK, QQ, AKs, AKo, AQs, A5s-A3s, KQs",
      call: "JJ-77, AJs, ATs, A9s, KJs, QJs, QTs, JTs, T9s, 98s, 87s, 76s, 65s, AQo",
      nota: "Cutoff abre, botón resube: el choque más frecuente de las mesas que ya juegan bien.",
    },
    ciegas: {
      fourBet: "AA, KK, QQ, AKs, AKo, AQs, A5s-A3s",
      call: "JJ-66, AJs, ATs, A9s, KQs, KJs, QJs, QTs, JTs, T9s, 98s, 87s, 76s, AQo",
      nota: "Abriste ancho desde posición tardía y una ciega te castiga. Tienes posición: iguala más y resube menos.",
    },
  },
  ciegas: {
    ciegas: {
      fourBet: "AA, KK, QQ, AKs, AKo, AQs, A5s-A3s, KQs",
      call: "JJ-77, AJs, ATs, KJs, QJs, JTs, T9s, 98s, 87s, 76s, AQo",
      nota: "Subiste desde la ciega pequeña y la grande resube. Cara a cara y con rangos anchos: se aguanta mucho más de lo normal.",
    },
  },
};

export function responseTo3Bet(opener: Position, threeBettor: Position): Response3Bet | null {
  return VS_3BET[zoneOf(opener)][zoneOf(threeBettor)] ?? null;
}

export function actionVs3Bet(
  opener: Position,
  threeBettor: Position,
  hand: HandCode,
): Action {
  const response = responseTo3Bet(opener, threeBettor);
  if (!response) return "fold";
  if (expandCached(response.fourBet).has(hand)) return "4bet";
  if (expandCached(response.call).has(hand)) return "call";
  return "fold";
}

/* ------------------------------------------- 3. resubiste y te vuelven a subir */

export interface Response4Bet {
  /** Con qué metes el stack entero. */
  jam: string;
  /** Con qué igualas el 4-bet y ves el flop. */
  call: string;
  nota: string;
}

/**
 * Resubiste y te han 4-beteado. La capa más cerrada del árbol: aquí se tira
 * casi todo, siempre.
 *
 * El detalle que casi nadie juega bien está en posición: se iguala con A-A en
 * vez de meterla. Si siempre metes A-A y A-K, tu rango de call se queda flojo y
 * el rival te apuesta el flop entero sin miedo. Dejando A-A dentro, su c-bet
 * siempre está en peligro.
 */
export const VS_4BET: Record<Zone, Response4Bet> = {
  temprana: {
    jam: "AA, KK",
    call: "QQ, AKs, AKo",
    nota: "Resubiste desde temprana y te vuelven a subir desde temprana: el rango más fuerte que verás en tu vida. Todo lo demás se tira sin drama.",
  },
  media: {
    jam: "AA, KK, AKs, AKo",
    call: "QQ, JJ",
    nota: "A-K entra en el all-in. Nunca se tira A-K a una subida final: no es un sitio bonito, pero es el que hay.",
  },
  tardia: {
    jam: "KK, QQ, AKs, AKo",
    call: "AA, JJ, TT, AQs, AJs, KQs",
    nota: "En posición, A-A se iguala en vez de meterse. Es lo que protege el resto de tu rango de call: mientras puedas tener A-A, su apuesta del flop nunca es gratis.",
  },
  ciegas: {
    jam: "AA, KK, QQ, AKs, AKo",
    call: "JJ, TT, AQs",
    nota: "Fuera de posición no hay nada que proteger: se mete o se tira. Igualar un 4-bet fuera de posición es regalar la mano.",
  },
};

export const responseTo4Bet = (threeBettor: Position): Response4Bet =>
  VS_4BET[zoneOf(threeBettor)];

export function actionVs4Bet(threeBettor: Position, hand: HandCode): Action {
  const response = responseTo4Bet(threeBettor);
  if (expandCached(response.jam).has(hand)) return "allin";
  if (expandCached(response.call).has(hand)) return "call";
  return "fold";
}

/* -------------------------------------------------------- añadidos explotativos */

/**
 * Lo que se le suma al rango de apertura **solo** cuando la mesa lo permite:
 * rivales que no resuben lo suficiente, que pagan de más y que juegan mal
 * postflop. No es "el rango bueno": es el rango base más un préstamo que la
 * mesa te está haciendo.
 *
 * Dos avisos que vienen con esto:
 * - "Un poco más ancho" no es el doble de manos.
 * - Contra rivales cerrados se juega **más cerrado**, no más ancho. Estos
 *   añadidos son para mesas flojas, no para mesas duras.
 */
export const EXPLOIT_ADD: Partial<Record<Position, string>> = {
  UTG: "55-44, A9s-A2s, K9s-K8s, QTs, T9s, 98s, 87s, 76s, 65s, AJo, KQo",
  "UTG+1": "55-44, A8s-A2s, K9s-K7s, QTs, J9s, 98s, 87s, 76s, 65s, KQo",
  "UTG+2": "44-33, A7s-A2s, K8s-K7s, Q9s-Q8s, J8s, T8s-T7s, 87s, 76s, 65s",
  LJ: "33, A6s-A2s, K8s-K7s, Q8s, J8s, T7s, 76s, 65s",
  HJ: "22, K7s-K6s, Q8s, J7s, T7s, 54s",
  CO: "K4s-K2s, Q7s, J7s, T6s, 95s, 85s, 74s, 64s, 53s, 43s",
  BTN: "Q3s-Q2s, J5s-J4s, T5s, 94s, 84s, 73s, 52s, K7o, Q8o, J8o, T8o, 87o",
  SB: "Q5s-Q2s, J6s-J5s, T6s, 95s, 85s, 74s, 64s, 53s, 43s, A3o-A2o, K8o, Q8o, J9o",
};

export function exploitAddFor(seat: Position): Set<HandCode> {
  const notation = EXPLOIT_ADD[seat];
  return notation ? expandCached(notation) : new Set<HandCode>();
}

/** El rango de apertura con los añadidos ya sumados, para medir cuánto ocupa. */
export function loosePercentFor(seat: Position, size: TableSize = DEFAULT_TABLE_SIZE): number {
  const hands = new Set(rangeFor(seat, "open", size));
  for (const hand of exploitAddFor(seat)) hands.add(hand);
  return rangePercent(hands);
}

/* ------------------------------------------------------------------- tamaños */

export interface Sizing {
  situacion: string;
  tamano: string;
  porque: string;
}

/**
 * Los tamaños del vídeo, en ciegas grandes. En 2/5 con ciegas de 5 dólares eso
 * es subir a 15 desde cualquier sitio y a 20 desde la ciega pequeña.
 */
export const SIZINGS: Sizing[] = [
  {
    situacion: "Abrir el bote",
    tamano: "3bb",
    porque: "En vivo casi nadie tira: subir más grande no compra más folds, solo arriesga más.",
  },
  {
    situacion: "Abrir desde la ciega pequeña",
    tamano: "4bb",
    porque:
      "Aquí no te importa que se retire, y el bote más grande hace que el rastrillo tope antes del flop: el resto de la mano se juega prácticamente sin rastrillo.",
  },
  {
    situacion: "Resubir en posición",
    tamano: "3x su subida",
    porque: "Vas a jugar todas las calles después que él: no necesitas cobrar más por adelantado.",
  },
  {
    situacion: "Resubir fuera de posición",
    tamano: "4x su subida",
    porque:
      "Un bote más grande deja menos stack detrás, y con menos stack detrás la posición vale menos. Estás comprando parte de su ventaja.",
  },
  {
    situacion: "Squeeze (hay un caller)",
    tamano: "+1x por cada caller",
    porque: "Más dinero muerto en el bote y más gente a la que hacer tirar.",
  },
  {
    situacion: "4-bet",
    tamano: "2,2x su 3-bet en posición · 2,5x fuera",
    porque: "Ya estás poniendo un cuarto del stack: no hace falta más.",
  },
];

/**
 * Cuánto se estrecha tu defensa cuando el rival abre más grande de lo normal.
 * En vivo hay mucha gente que abre a 5bb; a ese precio te está pidiendo casi el
 * doble para ganar lo mismo, y se defiende bastante menos.
 */
export const OPEN_SIZE_EFFECT: { tamano: string; defiendes: string }[] = [
  { tamano: "2bb (min-raise)", defiendes: "Bastante más ancho: el precio es excelente" },
  { tamano: "3bb", defiendes: "El rango de las tablas" },
  { tamano: "4bb", defiendes: "Un escalón más cerrado" },
  { tamano: "5bb o más", defiendes: "Mucho más cerrado. Ni siquiera J-J es un 3-bet automático" },
];

/* ------------------------------------------- 4. la ciega pequeña sin subir */

export interface SmallBlindPlan {
  /** Con qué subes a 4bb. */
  raise: string;
  /** Con qué entras pagando. Todo lo que no está en ninguna de las dos, se tira. */
  limp: string;
  nota: string;
}

/**
 * Le llega el bote a la ciega pequeña sin que nadie haya subido.
 *
 * Lo primero es que en una sala con rastrillo, **repartir** (chop) suele ser la
 * mejor jugada del día: un bote de dos ciegas paga un porcentaje enorme de
 * rastrillo para lo poco que hay dentro.
 *
 * Si no se reparte, hay dos rangos, y el detalle está en el de limp: no se
 * limpea solo la basura. Si subes con todo lo bueno y limpeas solo lo malo, tu
 * limp queda marcado y la ciega grande te sube encima cada vez. Por eso se
 * limpea también con parejas medias y manos decentes.
 *
 * El tamaño de la subida es 4bb, no 3bb: aquí no te importa que se retire, y
 * con el bote más grande el rastrillo topa antes del flop.
 */
export const SB_UNOPENED: SmallBlindPlan = {
  raise: "JJ+, ATs+, KTs+, QTs+, JTs, T9s, 98s, 87s, 76s, 65s, 54s, AQo+",
  limp: "TT-22, A9s-A2s, K9s-K2s, Q9s-Q2s, J9s-J2s, T8s-T2s, 97s-92s, 86s-82s, 75s-72s, 64s-62s, 53s-52s, 43s-42s, 32s, AJo-A2o, KQo-K5o, QJo-Q5o, JTo-J6o, T9o-T6o, 98o-96o, 87o-86o, 76o, 65o, 54o",
  nota: "Pones media ciega para ganar una y media: con un 30% de equity ya sale a cuenta entrar. Lo que no vale es entrar pagando y luego no saber soltar.",
};

/** Qué hacer con la mano cuando te llega el bote sin subir en la ciega pequeña. */
export function actionSBUnopened(hand: HandCode): Action {
  if (expandCached(SB_UNOPENED.raise).has(hand)) return "raise";
  if (expandCached(SB_UNOPENED.limp).has(hand)) return "call";
  return "fold";
}

export interface SBvsBBPlan {
  threeBet: string;
  call: string;
  nota: string;
}

/**
 * Limpeaste desde la ciega pequeña y la ciega grande te sube encima.
 *
 * Las manos fuertes ya no están aquí: las subiste antes. Con lo que queda se
 * resube lineal —lo mejor del rango de limp—, se paga el medio y se tira la
 * basura sin sentirse mal: entraste barato, ahora el precio es otro.
 */
export const SB_VS_BB_RAISE: SBvsBBPlan = {
  threeBet: "TT-88, A9s-A8s, K9s, Q9s, J9s, AJo, ATo, KQo",
  call: "77-22, A7s-A2s, K8s-K5s, Q8s-Q6s, J8s-J7s, T8s-T7s, 97s-96s, 86s-85s, 75s-74s, 64s, 53s, KJo, KTo, QJo, JTo",
  nota: "Tirar el 10-3s que limpeaste no es jugar débil: es lo que te permitía limpearlo. El error sería pagar la subida por no reconocer que ya no tienes precio.",
};

export function actionSBvsBBRaise(hand: HandCode): Action {
  if (expandCached(SB_VS_BB_RAISE.threeBet).has(hand)) return "3bet";
  if (expandCached(SB_VS_BB_RAISE.call).has(hand)) return "call";
  return "fold";
}

/* ------------------------------------------------------------ ajustes por rival */

export interface Adjustment {
  /** Lo que ves en la mesa. */
  lectura: string;
  /** Qué cambias. */
  ajuste: string;
  porque: string;
}

/**
 * Las tablas son el punto de partida; el dinero está en desviarse cuando la
 * mesa te lo regala. El ajuste que más gente hace al revés está el primero.
 */
export const ADJUSTMENTS: Adjustment[] = [
  {
    lectura: "El rival abre muy cerrado",
    ajuste: "Juegas más cerrado todavía",
    porque:
      "Contra un rango que solo trae manos buenas no hay manos marginales rentables. Mucha gente hace lo contrario y paga por 'darle acción'.",
  },
  {
    lectura: "Nadie resube casi nunca",
    ajuste: "Abres más ancho, pero solo desde CO y botón",
    porque:
      "Si no te van a resubir, tu apertura llega al flop en posición casi siempre. Desde temprana sigue habiendo cinco manos por detrás que se despiertan.",
  },
  {
    lectura: "Abren a 5bb en vez de 3bb",
    ajuste: "Defiendes bastante menos: ni J-J es un 3-bet automático",
    porque:
      "Arriesgar mucho para ganar poco solo se hace con rango fuerte, y tú pagas peor precio. Las dos cosas empujan en la misma dirección.",
  },
  {
    lectura: "Te resuben pequeño (subes a 3bb y te ponen 8bb)",
    ajuste: "Pagas más ancho de lo que dice la tabla",
    porque:
      "El precio es mejor y queda más stack detrás: se puede ver flop con manos que necesitan ligar algo para seguir.",
  },
  {
    lectura: "Abre un jugador malo y detrás queda uno bueno",
    ajuste: "Resubes más ancho para quedarte a solas con el malo",
    porque:
      "El 3-bet no es solo por valor: es para echar al bueno del bote y jugar la mano contra el que se equivoca.",
  },
  {
    lectura: "Los dos que quedan juegan mal",
    ajuste: "Pagas más y no te importa el bote multiway",
    porque:
      "Con dos rivales que pagan de más y no faroleas, el bote grande a tres bandas es tuyo más veces de las que dice la equity.",
  },
  {
    lectura: "La mesa paga todo y no farolea",
    ajuste: "Apuestas más fino por valor y faroleas mucho menos",
    porque:
      "No se echa a nadie de un bote que no quiere soltar. Contra una estación se gana cobrando, no mintiendo.",
  },
  {
    lectura: "Hay tres limpers delante",
    ajuste: "Isolas más grande (5bb + 1bb por limper) y con un rango más cerrado",
    porque:
      "Las tablas presuponen un bote heads-up. Con cuatro dentro, la mano media pierde muchísimo valor y la posición pesa más.",
  },
];

/* --------------------------------------------------------- efecto del stack */

export interface DepthEffect {
  profundidad: string;
  efecto: string;
}

/**
 * Cuanto más profundo se juega, más valen las manos que pueden hacer la nuts y
 * menos las que solo hacen pareja alta. Es el mismo argumento que explica por
 * qué K-8s se abre y K-8o no se abre nunca.
 */
export const DEPTH_EFFECT: DepthEffect[] = [
  { profundidad: "100bb", efecto: "Las tablas, tal cual. Es la profundidad para la que están hechas." },
  {
    profundidad: "200bb o más",
    efecto:
      "Suited arriba, offsuit abajo. El 3-bet se estrecha hacia A-A, K-K, A-K y ases suited: para meter mucho dinero quieres poder tener la nuts.",
  },
  {
    profundidad: "40bb o menos",
    efecto:
      "Offsuit sube: A-J y K-Q valen más porque la mano acaba antes y ligar pareja alta basta. Menos especulativas, más manos que ligan.",
  },
];
