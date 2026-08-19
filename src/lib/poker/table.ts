/**
 * La mesa vista desde arriba.
 *
 * Aquí vive todo lo que depende de dónde estás sentado y no del rango en sí:
 * en qué punto de la mesa se dibuja cada silla, quién habla antes y después que
 * tú en cada calle, cuánta información tienes cuando te toca decidir y qué se
 * puede hacer con ella (robar, farolear, frenar).
 *
 * Los rangos siguen en `ranges.ts`: este fichero solo los mira de reojo para
 * saber qué silla de 9-max hace de referencia en las mesas cortas.
 */

import {
  positionsFor,
  referenceSeat,
  seatsBehind,
  type Position,
  type TableSize,
} from "./ranges";

/* ------------------------------------------------------------- geometría */

/** Radios del óvalo, en porcentaje del contenedor. */
const RADIUS_X = 40;
const RADIUS_Y = 36;

export interface Seat {
  position: Position;
  /** Centro de la silla, en % del ancho y del alto del contenedor. */
  x: number;
  y: number;
  /** La silla desde la que estás mirando la mesa. */
  isHero: boolean;
  /** Orden de reparto empezando por ti: 0 eres tú, 1 el de tu izquierda... */
  index: number;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * Sillas colocadas alrededor del óvalo, contigo siempre abajo en el centro.
 *
 * A partir de ahí se reparte en el sentido del juego: el siguiente en hablar es
 * el de tu izquierda, que visto desde arriba queda a la izquierda de la pantalla,
 * y la vuelta se cierra por la derecha. Es el mismo recorrido que hace la ficha
 * de dealer en una mesa real.
 */
export function seatLayout(size: TableSize, hero: Position): Seat[] {
  const order = positionsFor(size);
  const start = Math.max(0, order.indexOf(hero));
  const step = 360 / order.length;

  return order.map((_, index) => {
    const angle = ((90 + index * step) * Math.PI) / 180;
    return {
      position: order[(start + index) % order.length],
      x: round(50 + RADIUS_X * Math.cos(angle)),
      y: round(50 + RADIUS_Y * Math.sin(angle)),
      isHero: index === 0,
      index,
    };
  });
}

/* --------------------------------------------------------- orden de acción */

/** Orden preflop: empieza el primero después de las ciegas y cierra la ciega grande. */
export function preflopOrder(size: TableSize): Position[] {
  return positionsFor(size);
}

/**
 * Orden del flop en adelante: hablan primero las ciegas y cierra siempre el botón.
 * En heads-up no hay ciega pequeña aparte, así que abre la ciega grande.
 */
export function postflopOrder(size: TableSize): Position[] {
  const seats = positionsFor(size);
  const blinds = seats.filter((seat) => seat === "SB" || seat === "BB");
  const rest = seats.filter((seat) => seat !== "SB" && seat !== "BB");
  return [...blinds, ...rest];
}

export type Street = "preflop" | "postflop";

const orderFor = (street: Street, size: TableSize): Position[] =>
  street === "preflop" ? preflopOrder(size) : postflopOrder(size);

/** Los que deciden antes que tú (por defecto, del flop en adelante). */
export function actsBefore(
  position: Position,
  size: TableSize,
  street: Street = "postflop",
): Position[] {
  const order = orderFor(street, size);
  const index = order.indexOf(position);
  return index <= 0 ? [] : order.slice(0, index);
}

/** Los que deciden después de ti: cada uno de ellos te ve actuar antes de decidir. */
export function actsAfter(
  position: Position,
  size: TableSize,
  street: Street = "postflop",
): Position[] {
  const order = orderFor(street, size);
  const index = order.indexOf(position);
  return index === -1 ? [] : order.slice(index + 1);
}

/** Tu turno dentro de la calle, empezando en 1. */
export function turnNumber(
  position: Position,
  size: TableSize,
  street: Street = "postflop",
): number {
  return orderFor(street, size).indexOf(position) + 1;
}

/** Verdadero si juegas toda la mano viendo actuar antes al rival. */
export function hasPositionOn(
  position: Position,
  rival: Position,
  size: TableSize,
): boolean {
  const order = postflopOrder(size);
  return order.indexOf(position) > order.indexOf(rival);
}

/* ------------------------------------------------- ventaja silla por silla */

export type InfoLevel = "Máxima" | "Alta" | "Media" | "Baja" | "Mínima";

export interface Playbook {
  /**
   * bb/100 que suele sacar de esa silla un jugador sólido en NL micro-medio,
   * repartiendo las ciegas como pérdida (que es como se mide de verdad).
   * Orden de magnitud sacado de las bases de datos que citan Clarke
   * ("The Grinder's Manual") y los informes de winrate por posición.
   */
  winrate: number;
  /** Cuánta información tienes cuando te toca decidir, contando el postflop. */
  info: InfoLevel;
  /** De dónde sale tu dinero en esta silla. */
  edge: string;
  /** Qué te dice la acción antes de que hables. */
  read: string;
  /** Cómo se farolea desde aquí sin regalar fichas. */
  bluff: string;
  /** El error que más dinero cuesta en esta silla. */
  trap: string;
}

/**
 * Un plan por silla de 9-max. Las mesas cortas reutilizan estos planes a través
 * de `referenceSeat`: lo que manda no es cuánta gente hay sentada, sino cuánta
 * queda por hablar detrás de ti.
 */
export const PLAYBOOK: Record<Position, Playbook> = {
  UTG: {
    winrate: 1,
    info: "Mínima",
    edge: "Hablas sin información, así que tu único filo es la fuerza: abres el rango más fuerte de la mesa y todos lo saben. Ganas cuando te pagan con manos peores, no cuando faroleas.",
    read: "No hay nada que leer todavía: nadie ha actuado. Lo único que puedes mirar es quién queda por detrás, y si son gente que resube mucho, aprieta el rango.",
    bluff: "Preflop, ninguno. Postflop tu c-bet solo es creíble en flops con As o Rey: son cartas que pegan a tu rango de apertura y casi no pegan al del que te iguala desde atrás.",
    trap: "Abrir manos vistosas que quedan dominadas (KJo, QTo, A9o). Contra ocho jugadores, «bonita» y «rentable» no son lo mismo.",
  },
  "UTG+1": {
    winrate: 2,
    info: "Mínima",
    edge: "Prácticamente lo mismo que UTG: un jugador menos por detrás no cambia el plan. Rango corto, apuestas por valor, poca creatividad.",
    read: "Solo has visto tirarse a uno. Un fold rápido no dice casi nada; guarda tu atención para las sillas tardías.",
    bluff: "Faroles muy contados y siempre con equity: proyectos de color o escalera, nunca aire puro.",
    trap: "Igualar la subida de UTG con manos medianas. Si no da para resubir, casi siempre da para tirar.",
  },
  "UTG+2": {
    winrate: 3,
    info: "Mínima",
    edge: "Empiezas a añadir manos que juegan bien en botes de tres o cuatro: suited connectors y parejas bajas que buscan flop grande.",
    read: "Si los dos de delante se tiran rápido, la mesa viene pasiva: puedes abrir una pizca más ancho de lo que dice la tabla.",
    bluff: "Semi-faroles con proyecto. El aire se guarda para cuando tengas posición.",
    trap: "Jugar por aburrimiento. Las manos que llegan aquí son las mismas que en el botón; lo que cambia es lo que pueden hacerte los de detrás.",
  },
  LJ: {
    winrate: 4,
    info: "Baja",
    edge: "Cinco por detrás: ya abres bastante más, pero necesitas manos que aguanten un 3-bet, no manos que solo ganan sin pelea.",
    read: "Fíjate en quién hay en el cutoff y el botón. Si son agresivos, tu apertura va a recibir; si son pasivos, robas gratis.",
    bluff: "El primer farol rentable de la mesa: 3-bet a la apertura de una silla temprana con manos como A5s o A4s, que bloquean AA y AK y siempre tienen algo que hacer en el flop.",
    trap: "Abrir ancho y luego tirar el 60% de las veces que te resuben. Si vas a abrirlo, ten un plan para el 3-bet.",
  },
  HJ: {
    winrate: 7,
    info: "Media",
    edge: "Cuatro por detrás y ya empieza a compensar robar. Aquí el objetivo doble es llevarte las ciegas o jugar el flop con iniciativa.",
    read: "Tres jugadores tirados delante es información real: el bote está limpio y las ciegas son el objetivo.",
    bluff: "Ataca al cutoff y al botón cuando abren ancho: un 3-bet desde aquí les obliga a jugar fuera de posición con un rango flojo.",
    trap: "Robar contra ciegas que defienden bien sin plan para el flop. Robar es abrir y apostar el flop, no abrir y rendirse.",
  },
  CO: {
    winrate: 13,
    info: "Alta",
    edge: "La segunda silla más rentable. Solo el botón y las ciegas por detrás, así que abres ancho y muchas veces te llevas el bote sin ver un flop.",
    read: "Si el botón se está tirando mucho, tu apertura es prácticamente un robo libre: te quedas en posición contra las dos ciegas.",
    bluff: "Robo de ciegas y c-bet en flops secos (A-7-2, K-8-3). Tu rango tiene más manos altas que el de quien defiende la ciega grande, y ese desequilibrio es el farol.",
    trap: "Abrir e igualar el 3-bet del botón «por precio». Fuera de posición contra un rango fuerte se pierde dinero calle a calle.",
  },
  BTN: {
    winrate: 27,
    info: "Máxima",
    edge: "La mejor silla del poker. Hablas el último en el flop, el turn y el river, así que decides el tamaño del bote en cada calle. Un ganador saca de aquí buena parte de su beneficio anual.",
    read: "Ves actuar a toda la mesa antes de decidir nada. Un flop pasado por todos = nadie tiene nada; una apuesta pequeña en board seco casi siempre pide que la subas.",
    bluff: "Aquí se farolea de verdad: robas ciegas con mucho más que manos buenas, floteas el flop para robar el turn cuando pasan, y en el river faroleas con las manos que bloquean lo que necesita el rival.",
    trap: "Perder la posición por avaricia: igualar un 3-bet gigante con manos malas solo porque estás en el botón. La posición vale mucho, no todo.",
  },
  SB: {
    winrate: -12,
    info: "Mínima",
    edge: "La peor silla de la mesa: pones medio ciego y luego hablas primero en todas las calles siguientes. Aquí no se trata de ganar, sino de perder poco.",
    read: "Cuando la mano llega entera hasta ti, quien haya abierto desde tarde tiene un rango flojo: contra eso se resube, no se iguala.",
    bluff: "Tu farol es la iniciativa: resube (3-bet) y apuesta el flop. Ser tú quien representa la mano fuerte compensa en parte hablar primero.",
    trap: "Igualar la subida para «ver un flop barato». Es la fuga clásica y la más cara: entras con un rango peor, fuera de posición y con la ciega grande aún por hablar.",
  },
  BB: {
    winrate: -25,
    info: "Baja",
    edge: "Ya has puesto una ciega, así que el precio para seguir es el mejor de la mesa. Todos los ganadores pierden dinero aquí: tu trabajo es perder menos.",
    read: "Desde qué silla te suben lo es todo. Un open de UTG es una mano de verdad; un open del botón es un robo la mitad de las veces y se defiende mucho más ancho.",
    bluff: "El check-raise en flops bajos y conectados (8-6-4, 7-5-3). Esos flops pegan a tu rango de defensa y casi no pegan al de quien abrió desde tempranas.",
    trap: "Defender todo porque «ya está pagado». Cada mano mala que igualas la juegas fuera de posición hasta el river.",
  },
};

/** Plan de la silla equivalente en heads-up, donde las reglas del botón cambian. */
const HEADS_UP: Partial<Record<Position, Playbook>> = {
  BTN: {
    winrate: 22,
    info: "Máxima",
    edge: "En heads-up el botón pone la ciega pequeña: habla primero preflop, pero último en el flop, el turn y el river. Por eso abre casi cualquier cosa.",
    read: "Solo tienes un rival: lo que importa no son las posiciones, es su patrón. Cuántas veces tira la ciega, cuántas veces paga el flop.",
    bluff: "Constante y barato: apuestas pequeñas y repetidas. Contra un solo rival cualquier board le falla la mayoría de las veces.",
    trap: "Igualar preflop en vez de subir. Igualar le regala ver el flop gratis y anula la ventaja de hablar el último después.",
  },
  BB: {
    winrate: -18,
    info: "Media",
    edge: "Un solo rival y ya tienes dinero puesto: aquí se defiende muchísimo más que en una mesa llena, con casi cualquier mano jugable.",
    read: "El tamaño de su apertura y lo que hace cuando pasas. Si apuesta siempre que pasas, empieza a pasar-subir con cualquier cosa que tenga algo.",
    bluff: "Check-raise al flop. Es la única forma de recuperar la iniciativa cuando vas a hablar primero el resto de la mano.",
    trap: "Tirar demasiado preflop. Contra un botón que abre el 80%, tirar mucho es regalarle las ciegas una tras otra.",
  },
};

/** El plan que aplica a esa silla con ese número de jugadores. */
export function playbookFor(position: Position, size: TableSize): Playbook {
  if (size === 2) return HEADS_UP[position] ?? PLAYBOOK[position];
  return PLAYBOOK[referenceSeat(position, size)];
}

/**
 * Resumen de una frase para la silla: la usa la mesa interactiva como titular.
 * Sale del número de jugadores que aún tienen que hablar detrás de ti.
 */
export function summaryFor(position: Position, size: TableSize): string {
  const behind = seatsBehind(position, size);
  const after = actsAfter(position, size).length;
  if (after === 0) return "Hablas el último en todas las calles: máxima información de la mesa.";
  if (behind === 0)
    return `Cierras el preflop, pero después hablas antes que ${after} ${after === 1 ? "rival" : "rivales"}.`;
  return `${behind} ${behind === 1 ? "jugador" : "jugadores"} por detrás preflop · ${after} ${
    after === 1 ? "rival habla" : "rivales hablan"
  } después de ti en el flop.`;
}
