/**
 * Motor de la mesa jugable.
 *
 * Reparte, cobra ciegas, lleva el orden de acción calle a calle, monta los
 * botes laterales cuando alguien va all-in y reparte en el showdown con el
 * mismo evaluador que usa el resto de la web.
 *
 * Todo son funciones puras sobre `GameState`: la interfaz solo pinta el estado
 * que le devuelven y los tests pueden jugar manos enteras sin React.
 *
 * Unidad interna: fichas enteras, con 1 ciega grande = 100 fichas. Trabajar con
 * enteros evita los decimales sueltos al partir un bote entre dos ganadores.
 */

import { DECK, deckWithout, hasDuplicates, type Card } from "./cards";
import { bestFive, describe, evaluate } from "./evaluator";
import { positionsFor, type Position, type TableSize } from "./ranges";
import { createRandom, nextSeed, shuffle } from "./random";

export const BIG_BLIND = 100;
export const SMALL_BLIND = 50;
export const STARTING_STACK = 100 * BIG_BLIND;

/**
 * El rastrillo de una sala en vivo: un 10% del bote con tope de 4bb, y solo si
 * se llega a ver el flop. Es la razón de que los rangos en vivo sean más
 * cerrados que los de torneo, y la razón de subir a 4bb desde la ciega pequeña:
 * la mano que se decide antes del flop no paga nada.
 */
export const RAKE = { percent: 0.1, capBB: 4 } as const;

/** Lo que se lleva la casa de un bote, en fichas. Sin flop no hay rastrillo. */
export function rakeFor(pot: number, sawFlop: boolean): number {
  if (!sawFlop) return 0;
  return Math.min(Math.floor(pot * RAKE.percent), RAKE.capBB * BIG_BLIND);
}

export type GameStreet = "preflop" | "flop" | "turn" | "river" | "showdown";

export const STREET_LABEL: Record<GameStreet, string> = {
  preflop: "Preflop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
  showdown: "Showdown",
};

/** Cartas del board en cada calle. */
const BOARD_SIZE: Record<GameStreet, number> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
  showdown: 5,
};

export type GameAction =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  /** `to` es la apuesta total de esa calle, no el incremento (raise to). */
  | { type: "raise"; to: number };

/**
 * Los cuatro rivales de la mesa. `estación` es el jugador que describe el vídeo
 * y que llena las salas en vivo: limpea mucho, paga demasiado y casi nunca
 * resube. Es al que hay que buscar, no al que hay que imitar.
 */
export type BotStyle = "sólido" | "agresivo" | "flojo" | "estación" | "hero";

export interface GamePlayer {
  /** Silla fija en el anillo: no cambia aunque rote el botón. */
  seat: number;
  name: string;
  isHero: boolean;
  /** Estilo del bot, para que no jueguen todos igual. */
  style: BotStyle;
  stack: number;
  /** La posición que le toca esta mano. */
  position: Position;
  cards: Card[];
  /** Fichas puestas en la calle actual. */
  bet: number;
  /** Fichas puestas en toda la mano. */
  committed: number;
  folded: boolean;
  allIn: boolean;
  /** Ha hablado desde la última subida. */
  acted: boolean;
  lastAction: string | null;
}

export interface LogEntry {
  hand: number;
  street: GameStreet;
  kind: "action" | "street" | "result";
  text: string;
}

export interface PotShare {
  seat: number;
  amount: number;
}

export interface RankedHand {
  seat: number;
  score: number;
  label: string;
  five: Card[];
}

export interface HandResult {
  /** Lo que se lleva cada silla. */
  payouts: PotShare[];
  showdown: boolean;
  ranked: RankedHand[];
  summary: string;
  /** Bote total, antes de que la casa cobre. */
  pot: number;
  /** Lo que se lleva la casa de este bote. */
  rake: number;
  /** Lo que gana o pierde el héroe en la mano, ya descontado lo que puso. */
  heroDelta: number;
}

export interface SessionStats {
  hands: number;
  won: number;
  showdownsWon: number;
  /** Fichas ganadas o perdidas en toda la sesión (incluye recompras). */
  net: number;
  biggestPot: number;
  rebuys: number;
  /** Fichas que se ha llevado la casa de los botes que ganaste. */
  rakePaid: number;
}

export interface GameState {
  size: TableSize;
  startingStack: number;
  /** Si la casa cobra rastrillo. Se puede apagar para comparar. */
  rake: boolean;
  handNumber: number;
  buttonSeat: number;
  heroSeat: number;
  players: GamePlayer[];
  board: Card[];
  deck: Card[];
  street: GameStreet;
  /** Fichas ya recogidas de calles cerradas. */
  pot: number;
  currentBet: number;
  /** Tamaño de la última subida: marca el mínimo de la siguiente. */
  lastRaise: number;
  /** Subidas de esta calle. Preflop: 1 = open, 2 = 3-bet, 3 = 4-bet. */
  raiseCount: number;
  aggressor: number | null;
  toAct: number | null;
  log: LogEntry[];
  result: HandResult | null;
  stats: SessionStats;
  seed: number;
}

export const EMPTY_STATS: SessionStats = {
  hands: 0,
  won: 0,
  showdownsWon: 0,
  net: 0,
  biggestPot: 0,
  rebuys: 0,
  rakePaid: 0,
};

/** Sesiones guardadas antes de que existiera un campo: se rellena el hueco. */
export const normalizeStats = (stats: Partial<SessionStats> | null | undefined): SessionStats => ({
  ...EMPTY_STATS,
  ...(stats ?? {}),
});

const BOT_NAMES = ["Nora", "Bruno", "Iris", "Marco", "Lena", "Toni", "Vera", "Hugo"];
const BOT_STYLES: BotStyle[] = ["estación", "agresivo", "flojo", "sólido", "estación", "agresivo"];

/* ------------------------------------------------------------------ formato */

/** Fichas a ciegas grandes: 250 → "2,5bb". */
export function formatBB(chips: number): string {
  const bb = chips / BIG_BLIND;
  const text = Number.isInteger(bb) ? String(bb) : bb.toFixed(1).replace(".", ",");
  return `${text}bb`;
}

/* ------------------------------------------------------------ construcción */

export function createGame(options: {
  size: TableSize;
  startingStack?: number;
  seed?: number;
  stats?: SessionStats;
  rake?: boolean;
}): GameState {
  const {
    size,
    startingStack = STARTING_STACK,
    seed = 0x5eed1,
    stats = EMPTY_STATS,
    rake = true,
  } = options;
  const order = positionsFor(size);
  const heroSeat = 0;

  const players: GamePlayer[] = Array.from({ length: size }, (_, seat) => ({
    seat,
    name: seat === heroSeat ? "Tú" : BOT_NAMES[(seat - 1) % BOT_NAMES.length],
    isHero: seat === heroSeat,
    style: seat === heroSeat ? "hero" : BOT_STYLES[(seat - 1) % BOT_STYLES.length],
    stack: startingStack,
    position: order[seat % order.length],
    cards: [],
    bet: 0,
    committed: 0,
    folded: true,
    allIn: false,
    acted: false,
    lastAction: null,
  }));

  return {
    size,
    startingStack,
    rake,
    handNumber: 0,
    // La primera mano se reparte con el héroe en el botón.
    buttonSeat: heroSeat,
    heroSeat,
    players,
    board: [],
    deck: [],
    street: "preflop",
    pot: 0,
    currentBet: 0,
    lastRaise: BIG_BLIND,
    raiseCount: 0,
    aggressor: null,
    toAct: null,
    log: [],
    result: null,
    stats,
    seed,
  };
}

/** La posición que le toca a cada silla con el botón donde está. */
export function positionOf(seat: number, buttonSeat: number, size: TableSize): Position {
  const order = positionsFor(size);
  const buttonIndex = order.indexOf("BTN");
  return order[(((seat - buttonSeat + buttonIndex) % size) + size) % size];
}

const seatWithPosition = (state: GameState, position: Position): number =>
  state.players.findIndex((player) => player.position === position);

/* ------------------------------------------------------------- repartir mano */

/** Un entero que existe en la baraja. */
const isCard = (card: number): boolean => Number.isInteger(card) && card >= 0 && card < 52;

/** Dos cartas distintas y dentro de la baraja: lo que se puede forzar al héroe. */
export function isValidHeroCards(cards: readonly Card[] | undefined): cards is readonly Card[] {
  return cards !== undefined && cards.length === 2 && cards.every(isCard) && !hasDuplicates(cards);
}

/**
 * Las cartas del board que se pueden forzar: hasta cinco, sin repetir y sin
 * chocar con la mano elegida. Salen en orden, así que tres fijan el flop, la
 * cuarta el turn y la quinta el river; con menos, el resto se reparte al azar.
 */
export function fixedBoard(board: readonly Card[] | undefined, heroCards: readonly Card[]): Card[] {
  if (board === undefined || board.length === 0 || board.length > 5) return [];
  if (!board.every(isCard) || hasDuplicates([...board, ...heroCards])) return [];
  return [...board];
}

/**
 * Deja la mano a medias y devuelve a cada uno lo que había puesto.
 *
 * Es lo que hace falta para cambiar las cartas en mitad de una mano: como no
 * hay ganador, nadie paga nada y la sesión no cuenta esa mano.
 */
export function abandonHand(state: GameState): GameState {
  if (state.handNumber === 0 || state.result !== null) return state;
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      stack: player.stack + player.committed,
      bet: 0,
      committed: 0,
    })),
    pot: 0,
    currentBet: 0,
    toAct: null,
  };
}

/**
 * Nueva mano: rota el botón, recompra a quien se quedó sin fichas y reparte.
 *
 * `heroCards` y `board` fuerzan tu mano y las cartas comunes (para practicar un
 * sitio concreto): esas cartas salen de la baraja antes de mezclar —así nadie
 * puede tener una copia— y el board elegido se pone encima del mazo, de donde
 * salen el flop, el turn y el river. El resto de la mesa reparte normal.
 */
export function startHand(
  state: GameState,
  options: { heroCards?: readonly Card[]; board?: readonly Card[] } = {},
): GameState {
  const size = state.size;
  const handNumber = state.handNumber + 1;
  const buttonSeat = state.handNumber === 0 ? state.buttonSeat : (state.buttonSeat + 1) % size;
  const random = createRandom(state.seed);
  const chosen = isValidHeroCards(options.heroCards) ? [...options.heroCards] : null;
  const board = fixedBoard(options.board, chosen ?? []);
  const reserved = [...(chosen ?? []), ...board];
  const deck = shuffle(reserved.length > 0 ? deckWithout(reserved) : DECK, random);
  let rebuys = state.stats.rebuys;
  let net = state.stats.net;

  const players: GamePlayer[] = state.players.map((player) => {
    let stack = player.stack;
    if (stack < BIG_BLIND) {
      // Recompra automática: la mesa sigue viva y la sesión se mide en el neto.
      if (player.isHero) {
        rebuys += 1;
        net -= state.startingStack - stack;
      }
      stack = state.startingStack;
    }
    return {
      ...player,
      stack,
      position: positionOf(player.seat, buttonSeat, size),
      cards: [],
      bet: 0,
      committed: 0,
      folded: false,
      allIn: false,
      acted: false,
      lastAction: null,
    };
  });

  // Reparto en el orden de la mesa: primera carta al primero después del botón.
  let index = 0;
  for (let round = 0; round < 2; round++) {
    for (let step = 1; step <= size; step++) {
      const seat = (buttonSeat + step) % size;
      players[seat].cards.push(chosen && seat === state.heroSeat ? chosen[round] : deck[index++]);
    }
  }

  let next: GameState = {
    ...state,
    handNumber,
    buttonSeat,
    players,
    board: [],
    deck: [...board, ...deck.slice(index)],
    street: "preflop",
    pot: 0,
    currentBet: 0,
    lastRaise: BIG_BLIND,
    raiseCount: 0,
    aggressor: null,
    toAct: null,
    log: [{ hand: handNumber, street: "preflop", kind: "street", text: `Mano ${handNumber}` }],
    result: null,
    stats: { ...state.stats, rebuys, net },
    seed: nextSeed(state.seed),
  };

  // Ciegas. En heads-up las pone el botón (pequeña) y el otro jugador (grande).
  const sbSeat = size === 2 ? seatWithPosition(next, "BTN") : seatWithPosition(next, "SB");
  const bbSeat = seatWithPosition(next, "BB");
  next = postBlind(next, sbSeat, SMALL_BLIND, "ciega pequeña");
  next = postBlind(next, bbSeat, BIG_BLIND, "ciega grande");
  next = { ...next, currentBet: BIG_BLIND, lastRaise: BIG_BLIND };

  // Preflop habla primero quien abre el orden de la mesa (UTG, o el botón en heads-up).
  const firstToAct = seatWithPosition(next, positionsFor(size)[0]);
  return { ...next, toAct: nextActor(next, firstToAct, true) };
}

function postBlind(state: GameState, seat: number, amount: number, blind: string): GameState {
  const players = state.players.map((player) => {
    if (player.seat !== seat) return player;
    const paid = Math.min(amount, player.stack);
    return {
      ...player,
      stack: player.stack - paid,
      bet: player.bet + paid,
      committed: player.committed + paid,
      allIn: player.stack - paid === 0,
      lastAction: blind,
    };
  });
  return { ...state, players };
}

/* --------------------------------------------------------- acciones legales */

export interface LegalMoves {
  seat: number;
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  /** Fichas que hay que poner para igualar (ya recortado a tu stack). */
  callAmount: number;
  canRaise: boolean;
  minRaiseTo: number;
  maxRaiseTo: number;
  /** Bote ahora mismo, con las apuestas de la calle ya dentro. */
  potNow: number;
  /** true si la única subida posible es meter todo el stack. */
  raiseIsAllIn: boolean;
}

export function totalPot(state: GameState): number {
  return state.pot + state.players.reduce((sum, player) => sum + player.bet, 0);
}

export function legalMoves(state: GameState, seat: number): LegalMoves {
  const player = state.players[seat];
  const toCall = Math.max(0, state.currentBet - player.bet);
  const callAmount = Math.min(toCall, player.stack);
  const maxRaiseTo = player.bet + player.stack;
  const minRaiseTo = Math.min(maxRaiseTo, Math.max(state.currentBet + state.lastRaise, BIG_BLIND));
  return {
    seat,
    canFold: toCall > 0,
    canCheck: toCall === 0,
    canCall: toCall > 0 && player.stack > 0,
    callAmount,
    canRaise: player.stack > callAmount,
    minRaiseTo,
    maxRaiseTo,
    potNow: totalPot(state),
    raiseIsAllIn: maxRaiseTo <= minRaiseTo,
  };
}

/* --------------------------------------------------------- aplicar acciones */

const entryFor = (state: GameState, seat: number, text: string): LogEntry => ({
  hand: state.handNumber,
  street: state.street,
  kind: "action",
  text: `${state.players[seat].name} (${state.players[seat].position}) ${text}`,
});

export function applyAction(state: GameState, action: GameAction): GameState {
  const seat = state.toAct;
  if (seat === null || state.result) return state;

  const legal = legalMoves(state, seat);
  const players = state.players.map((player) => ({ ...player }));
  const player = players[seat];
  let currentBet = state.currentBet;
  let lastRaise = state.lastRaise;
  let raiseCount = state.raiseCount;
  let aggressor = state.aggressor;
  let entry: LogEntry;
  let reopen = false;

  if (action.type === "fold") {
    player.folded = true;
    player.acted = true;
    player.lastAction = "fold";
    entry = entryFor(state, seat, "se tira");
  } else if (action.type === "check") {
    if (!legal.canCheck) return state;
    player.acted = true;
    player.lastAction = "check";
    entry = entryFor(state, seat, "pasa");
  } else if (action.type === "call") {
    const paid = legal.callAmount;
    player.stack -= paid;
    player.bet += paid;
    player.committed += paid;
    player.allIn = player.stack === 0;
    player.acted = true;
    player.lastAction = player.allIn ? "all-in" : "call";
    entry = entryFor(
      state,
      seat,
      player.allIn ? `iguala all-in (${formatBB(paid)})` : `paga ${formatBB(paid)}`,
    );
  } else {
    const to = Math.max(legal.minRaiseTo, Math.min(action.to, legal.maxRaiseTo));
    const paid = to - player.bet;
    if (paid <= 0) return state;
    const increment = to - currentBet;
    const wasBet = currentBet === 0;
    player.stack -= paid;
    player.bet = to;
    player.committed += paid;
    player.allIn = player.stack === 0;
    player.acted = true;
    player.lastAction = player.allIn ? "all-in" : wasBet ? "bet" : "raise";
    // Una subida corta por all-in no reabre la apuesta a quien ya había hablado.
    reopen = increment >= lastRaise;
    if (reopen) lastRaise = increment;
    currentBet = to;
    raiseCount += 1;
    aggressor = seat;
    entry = entryFor(
      state,
      seat,
      player.allIn
        ? `va all-in a ${formatBB(to)}`
        : wasBet
          ? `apuesta ${formatBB(to)}`
          : `sube a ${formatBB(to)}`,
    );
  }

  if (reopen) {
    for (const other of players) {
      if (other.seat !== seat && !other.folded && !other.allIn) other.acted = false;
    }
  }

  const next: GameState = {
    ...state,
    players,
    currentBet,
    lastRaise,
    raiseCount,
    aggressor,
    log: [...state.log, entry],
  };

  return advance(next, seat);
}

/** Siguiente silla que puede hablar a partir de `from` (incluida si `inclusive`). */
function nextActor(state: GameState, from: number, inclusive = false): number | null {
  const size = state.size;
  for (let step = inclusive ? 0 : 1; step <= size; step++) {
    const seat = (from + step) % size;
    const player = state.players[seat];
    if (player.folded || player.allIn) continue;
    if (player.acted && player.bet === state.currentBet) continue;
    return seat;
  }
  return null;
}

const contenders = (state: GameState): GamePlayer[] => state.players.filter((p) => !p.folded);

function roundComplete(state: GameState): boolean {
  const alive = contenders(state);
  if (alive.length <= 1) return true;
  const active = alive.filter((player) => !player.allIn);
  if (active.length === 0) return true;
  return active.every((player) => player.acted && player.bet === state.currentBet);
}

/** Cierra la calle o pasa el turno al siguiente. */
function advance(state: GameState, from: number): GameState {
  if (contenders(state).length <= 1) return settle(collectBets(state), false);
  if (!roundComplete(state)) return { ...state, toAct: nextActor(state, from) };
  return closeStreet(state);
}

function collectBets(state: GameState): GameState {
  const collected = state.players.reduce((sum, player) => sum + player.bet, 0);
  return {
    ...state,
    pot: state.pot + collected,
    players: state.players.map((player) => ({ ...player, bet: 0 })),
    currentBet: 0,
    lastRaise: BIG_BLIND,
    raiseCount: 0,
  };
}

const NEXT_STREET: Record<GameStreet, GameStreet> = {
  preflop: "flop",
  flop: "turn",
  turn: "river",
  river: "showdown",
  showdown: "showdown",
};

function closeStreet(state: GameState): GameState {
  let next = collectBets(state);
  next = {
    ...next,
    players: next.players.map((player) => ({ ...player, acted: false, lastAction: null })),
    aggressor: null,
    toAct: null,
  };

  // Si ya nadie puede apostar, se corre el board entero hasta el showdown.
  const canStillBet = contenders(next).filter((player) => !player.allIn).length > 1;

  for (;;) {
    const street = NEXT_STREET[next.street];
    if (street === "showdown") return settle(next, true);
    const needed = BOARD_SIZE[street] - next.board.length;
    next = {
      ...next,
      street,
      board: [...next.board, ...next.deck.slice(0, needed)],
      deck: next.deck.slice(needed),
      log: [
        ...next.log,
        {
          hand: next.handNumber,
          street,
          kind: "street",
          text: `${STREET_LABEL[street]} · bote ${formatBB(next.pot)}`,
        },
      ],
    };
    if (!canStillBet) continue;
    const firstSeat = (next.buttonSeat + 1) % next.size;
    const toAct = nextActor(next, firstSeat, true);
    if (toAct === null) continue;
    return { ...next, toAct };
  }
}

/* ------------------------------------------------------------- botes y pago */

export interface Pot {
  amount: number;
  eligible: number[];
}

/** Bote principal y laterales, a partir de lo que ha puesto cada uno. */
export function buildPots(players: readonly GamePlayer[]): Pot[] {
  const levels = [...new Set(players.filter((p) => p.committed > 0).map((p) => p.committed))].sort(
    (a, b) => a - b,
  );
  const pots: Pot[] = [];
  let previous = 0;
  for (const level of levels) {
    let amount = 0;
    const eligible: number[] = [];
    for (const player of players) {
      amount += Math.min(player.committed, level) - Math.min(player.committed, previous);
      if (!player.folded && player.committed >= level) eligible.push(player.seat);
    }
    if (amount > 0) {
      // Si a ese nivel no queda nadie con derecho (todos se tiraron), las fichas
      // se suman al bote anterior en vez de desaparecer de la mesa.
      if (eligible.length === 0 && pots.length > 0) pots[pots.length - 1].amount += amount;
      else if (eligible.length > 0) pots.push({ amount, eligible });
    }
    previous = level;
  }
  return pots;
}

/** Orden para la ficha suelta de un bote impar: el primero después del botón. */
const chipOrder = (state: GameState, seats: number[]): number[] =>
  [...seats].sort(
    (a, b) =>
      ((a - state.buttonSeat + state.size) % state.size) -
      ((b - state.buttonSeat + state.size) % state.size),
  );

function settle(state: GameState, showdown: boolean): GameState {
  const alive = contenders(state);
  const pots = buildPots(state.players);
  const potTotal = pots.reduce((sum, pot) => sum + pot.amount, 0);
  // La casa cobra antes de repartir, y empieza por el bote principal.
  const rake = state.rake ? rakeFor(potTotal, state.board.length >= 3) : 0;
  let pending = rake;
  for (const pot of pots) {
    const taken = Math.min(pot.amount, pending);
    pot.amount -= taken;
    pending -= taken;
    if (pending === 0) break;
  }
  const payouts = new Map<number, number>();

  const ranked: RankedHand[] = showdown
    ? alive
        .map((player) => {
          const cards = [...player.cards, ...state.board];
          const score = evaluate(cards);
          return { seat: player.seat, score, label: describe(score), five: bestFive(cards) };
        })
        .sort((a, b) => b.score - a.score)
    : [];

  const scoreOf = new Map(ranked.map((entry) => [entry.seat, entry.score]));

  for (const pot of pots) {
    const eligible = pot.eligible;
    if (eligible.length === 0) continue;
    let winners: number[];
    if (!showdown || eligible.length === 1) {
      winners = [eligible[0]];
    } else {
      const best = Math.max(...eligible.map((seat) => scoreOf.get(seat) ?? -1));
      winners = eligible.filter((seat) => scoreOf.get(seat) === best);
    }
    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount - share * winners.length;
    chipOrder(state, winners).forEach((seat, index) => {
      payouts.set(seat, (payouts.get(seat) ?? 0) + share + (index < remainder ? 1 : 0));
    });
  }

  const players = state.players.map((player) => ({
    ...player,
    stack: player.stack + (payouts.get(player.seat) ?? 0),
    bet: 0,
  }));

  const heroSeat = state.heroSeat;
  const heroPayout = payouts.get(heroSeat) ?? 0;
  const heroDelta = heroPayout - state.players[heroSeat].committed;
  // El rastrillo sale del bote, así que lo paga quien se lo lleva.
  const paidTotal = potTotal - rake;
  const heroRake = paidTotal > 0 ? Math.round((rake * heroPayout) / paidTotal) : 0;
  const winnerSeats = [...payouts.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([seat]) => seat);

  const nameOf = (seat: number) => state.players[seat].name;
  const casa = rake > 0 ? ` La casa se lleva ${formatBB(rake)} de rastrillo.` : "";
  const summary =
    (!showdown
      ? `${nameOf(winnerSeats[0])} se lleva ${formatBB(paidTotal)} sin enseñar cartas.`
      : winnerSeats.length === 1
        ? `${nameOf(winnerSeats[0])} gana ${formatBB(paidTotal)} con ${(
            ranked.find((entry) => entry.seat === winnerSeats[0])?.label ?? "la mejor mano"
          ).toLowerCase()}.`
        : `Bote repartido entre ${winnerSeats.map(nameOf).join(" y ")}.`) + casa;

  const heroWon = (payouts.get(heroSeat) ?? 0) > 0;
  const stats: SessionStats = {
    hands: state.stats.hands + 1,
    won: state.stats.won + (heroWon ? 1 : 0),
    showdownsWon: state.stats.showdownsWon + (heroWon && showdown && alive.length > 1 ? 1 : 0),
    net: state.stats.net + heroDelta,
    biggestPot: Math.max(state.stats.biggestPot, potTotal),
    rebuys: state.stats.rebuys,
    rakePaid: state.stats.rakePaid + heroRake,
  };

  return {
    ...state,
    players,
    pot: 0,
    currentBet: 0,
    toAct: null,
    street: "showdown",
    result: {
      payouts: [...payouts].map(([seat, amount]) => ({ seat, amount })),
      showdown,
      ranked,
      summary,
      pot: potTotal,
      rake,
      heroDelta,
    },
    stats,
    log: [
      ...state.log,
      { hand: state.handNumber, street: "showdown", kind: "result", text: summary },
    ],
  };
}

/* -------------------------------------------------------------- utilidades */

export const heroPlayer = (state: GameState): GamePlayer => state.players[state.heroSeat];

export const isHeroTurn = (state: GameState): boolean => state.toAct === state.heroSeat;

/** Sillas que enseñan cartas: en el showdown, todas las que llegan. */
export function revealedSeats(state: GameState): number[] {
  if (!state.result?.showdown) return [state.heroSeat];
  return state.players.filter((player) => !player.folded).map((player) => player.seat);
}
