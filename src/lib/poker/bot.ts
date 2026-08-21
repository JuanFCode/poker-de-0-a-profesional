/**
 * Los rivales de la mesa jugable.
 *
 * No hay ninguna IA aquí dentro: los bots juegan exactamente con el material
 * del curso. Preflop consultan los mismos rangos que enseña el entrenador
 * (`ranges.ts`) y el mismo árbol de open / 3-bet / 4-bet (`preflop-tree.ts`).
 * Del flop en adelante calculan su equity con el Monte Carlo de `equity.ts` y
 * la comparan con las pot odds de `odds.ts`, que es la cuenta que se explica en
 * el módulo de matemáticas.
 *
 * Cada bot tiene un estilo que desplaza esas mismas tablas: el flojo abre con
 * los añadidos explotativos y paga de más, el agresivo convierte calls en
 * 3-bets y farolea más, el sólido juega la tabla tal cual.
 */

import { calculateEquity } from "./equity";
import {
  BIG_BLIND,
  legalMoves,
  type BotStyle,
  type GameAction,
  type GameState,
} from "./game";
import { handCodeOf, type HandCode } from "./notation";
import {
  actionVs3Bet,
  actionVs4Bet,
  actionVsOpen,
  defenseFor,
  exploitAddFor,
  responseTo3Bet,
  responseTo4Bet,
} from "./preflop-tree";
import { requiredEquity } from "./odds";
import { notationFor, rangeFor, referenceSeat, type Action, type Position } from "./ranges";
import { hasPositionOn } from "./table";

/** Cuántos rivales siguen vivos en la mano además de `seat`. */
export function rivalsOf(state: GameState, seat: number): number {
  return state.players.filter((player) => player.seat !== seat && !player.folded).length;
}

/* ----------------------------------------------------------------- preflop */

export interface PreflopPlan {
  /** Lo que dicen las tablas del curso. */
  action: Action;
  /** Subida sugerida, en fichas (apuesta total de la calle). */
  raiseTo: number;
  /** La situación: "abres el bote", "te han resubido"... */
  spot: string;
  /** El rango exacto del que sale la decisión, en notación. */
  notation?: string;
  /** La frase del curso que explica ese rango. */
  note: string;
}

/** Quién ha metido la primera subida de la calle, si hay alguna. */
const aggressorPosition = (state: GameState): Position | null =>
  state.aggressor === null ? null : state.players[state.aggressor].position;

/** Jugadores que solo han igualado la subida: cada uno engorda el squeeze. */
function callersBehindRaise(state: GameState): number {
  return state.players.filter(
    (player) =>
      !player.folded &&
      player.seat !== state.aggressor &&
      player.bet === state.currentBet &&
      player.bet > BIG_BLIND,
  ).length;
}

/**
 * El plan preflop de una silla según el curso. Lo usan los bots para decidir y
 * el entrenador para explicarle al jugador lo que decía la tabla.
 */
export function preflopPlan(state: GameState, seat: number): PreflopPlan {
  const me = state.players[seat];
  const hand: HandCode = handCodeOf(me.cards[0], me.cards[1]);
  const size = state.size;
  const position = me.position;
  const opener = aggressorPosition(state);
  const inPosition = opener ? hasPositionOn(position, opener, size) : true;

  // Nadie ha subido: abres o te tiras.
  if (state.raiseCount === 0 || opener === null) {
    const open = rangeFor(position, "open", size);
    const openTo = position === "SB" ? 4 * BIG_BLIND : 3 * BIG_BLIND;
    return {
      action: open.has(hand) ? "raise" : "fold",
      raiseTo: openTo,
      spot: "Abres el bote",
      notation: notationFor(position, "open", size),
      note:
        position === "SB"
          ? "Desde la ciega pequeña se abre a 4bb: el bote grande te compensa hablar primero el resto de la mano."
          : "Si abres, abres subiendo a 3bb. Entrar pagando (limp) regala el bote a quien tenga posición.",
    };
  }

  // Alguien ha subido una vez: defiendes con el árbol de la lección de 3-bet.
  if (state.raiseCount === 1) {
    const defense = defenseFor(position, opener);
    const action = defense
      ? actionVsOpen(position, opener, hand)
      : rangeFor(position, "threeBet", size).has(hand)
        ? "3bet"
        : rangeFor(position, "call", size).has(hand)
          ? "call"
          : "fold";
    const multiplier = (inPosition ? 3 : 4) + callersBehindRaise(state);
    return {
      action,
      raiseTo: multiplier * state.currentBet,
      spot: `Te han subido desde ${opener}`,
      notation: defense ? (action === "call" ? defense.call : defense.threeBet) : undefined,
      note:
        defense?.nota ??
        "Sin plan de mesa para este cruce: solo siguen las manos con las que resubirías.",
    };
  }

  // Te han resubido. Si la subida inicial fue tuya, mandan las tablas de 3-bet.
  const iOpened = me.lastAction === "raise" || me.lastAction === "bet";
  if (state.raiseCount === 2) {
    if (iOpened) {
      const response = responseTo3Bet(position, opener);
      const action = response ? actionVs3Bet(position, opener, hand) : "fold";
      return {
        action,
        raiseTo: Math.round((inPosition ? 2.2 : 2.5) * state.currentBet),
        spot: `Abriste y ${opener} te resube`,
        notation: response ? (action === "call" ? response.call : response.fourBet) : undefined,
        note:
          response?.nota ??
          "Contra un 3-bet sin plan de mesa se juega solo lo que aguanta un 4-bet.",
      };
    }
    // Entrar en un bote de 3-bet sin haber abierto: la capa más cerrada del árbol.
    const action = actionVs4Bet(opener, hand);
    return {
      action: action === "allin" ? "4bet" : action,
      raiseTo: Math.round(2.2 * state.currentBet),
      spot: `Hay open y 3-bet delante`,
      notation: responseTo4Bet(opener).jam,
      note: "Meterse en un bote de 3-bet sin haber abierto pide un rango de premio: aquí se tira casi todo.",
    };
  }

  // 4-bet o más: se mete o se tira.
  const response = responseTo4Bet(opener);
  return {
    action: actionVs4Bet(opener, hand),
    raiseTo: state.players[seat].bet + state.players[seat].stack,
    spot: "Bote de 4-bet",
    notation: `${response.jam} (all-in) · ${response.call} (call)`,
    note: response.nota,
  };
}

/* ---------------------------------------------------------------- postflop */

export interface EquityRead {
  equity: number;
  rivals: number;
}

/** Equity contra manos al azar. Pocas iteraciones: decide un bot, no un solver. */
export function quickEquity(
  state: GameState,
  seat: number,
  iterations = 400,
  seed = 1,
): EquityRead {
  const rivals = rivalsOf(state, seat);
  const result = calculateEquity({
    hero: state.players[seat].cards,
    opponents: Array.from({ length: rivals }, () => ({ kind: "random" as const })),
    board: state.board,
    iterations,
    seed,
  });
  return { equity: result.hero.equity, rivals };
}

/* -------------------------------------------------------------- decisiones */

export interface BotMove {
  action: GameAction;
  /** Por qué, en una frase: se ve en el registro de la mano. */
  reason: string;
}

/** Ajustes de cada estilo sobre las mismas tablas. */
const STYLE = {
  sólido: { widen: false, callBonus: 0, bluff: 0.08, valueGate: 0.62 },
  agresivo: { widen: true, callBonus: -0.02, bluff: 0.22, valueGate: 0.56 },
  flojo: { widen: true, callBonus: 0.09, bluff: 0.03, valueGate: 0.68 },
  hero: { widen: false, callBonus: 0, bluff: 0.08, valueGate: 0.62 },
} satisfies Record<BotStyle, { widen: boolean; callBonus: number; bluff: number; valueGate: number }>;

const clampRaise = (state: GameState, seat: number, to: number): number => {
  const legal = legalMoves(state, seat);
  return Math.max(legal.minRaiseTo, Math.min(Math.round(to), legal.maxRaiseTo));
};

/** La jugada del bot que tiene el turno. */
export function botMove(state: GameState, seat: number, random: () => number): BotMove {
  return state.street === "preflop"
    ? preflopMove(state, seat, random)
    : postflopMove(state, seat, random);
}

function preflopMove(state: GameState, seat: number, random: () => number): BotMove {
  const me = state.players[seat];
  const style = STYLE[me.style];
  const legal = legalMoves(state, seat);
  const plan = preflopPlan(state, seat);
  const hand = handCodeOf(me.cards[0], me.cards[1]);
  let action = plan.action;

  // El flojo y el agresivo añaden las manos explotativas a su apertura.
  if (
    action === "fold" &&
    state.raiseCount === 0 &&
    style.widen &&
    exploitAddFor(referenceSeat(me.position, state.size)).has(hand)
  ) {
    action = "raise";
  }
  // El agresivo convierte parte de sus calls en 3-bet; el flojo, al revés.
  if (action === "call" && me.style === "agresivo" && random() < 0.35) action = "3bet";
  if (action === "3bet" && me.style === "flojo" && random() < 0.4) action = "call";
  // El flojo paga de más desde la ciega grande cuando el precio es barato.
  if (
    action === "fold" &&
    me.style === "flojo" &&
    legal.callAmount > 0 &&
    legal.callAmount <= 2 * BIG_BLIND &&
    legal.potNow / legal.callAmount > 3.5 &&
    random() < 0.45
  ) {
    action = "call";
  }

  if (action === "fold") {
    return legal.canCheck
      ? { action: { type: "check" }, reason: `${plan.spot}: pasa y ve el flop gratis.` }
      : { action: { type: "fold" }, reason: `${plan.spot}: la mano no está en el rango.` };
  }
  if (action === "call") {
    if (legal.canCheck) return { action: { type: "check" }, reason: `${plan.spot}: mano jugable.` };
    return { action: { type: "call" }, reason: `${plan.spot}: iguala con el rango de call.` };
  }
  if (!legal.canRaise) {
    return legal.canCall
      ? { action: { type: "call" }, reason: "Sin fichas para subir: iguala." }
      : { action: { type: "check" }, reason: "Sin fichas para subir: pasa." };
  }
  const to = clampRaise(state, seat, plan.raiseTo);
  return {
    action: { type: "raise", to },
    reason: `${plan.spot}: ${action === "raise" ? "abre" : action} con el rango de la tabla.`,
  };
}

function postflopMove(state: GameState, seat: number, random: () => number): BotMove {
  const me = state.players[seat];
  const style = STYLE[me.style];
  const legal = legalMoves(state, seat);
  const seed = (state.handNumber * 97 + seat * 13 + state.board.length * 7) | 0;
  const { equity, rivals } = quickEquity(state, seat, 400, seed || 1);
  // Con más rivales hace falta más mano para meter dinero.
  const gate = style.valueGate + Math.max(0, rivals - 1) * 0.07;

  if (legal.callAmount > 0) {
    const needed = requiredEquity(legal.potNow, legal.callAmount) - style.callBonus;
    if (equity > gate && legal.canRaise && random() < 0.6) {
      const to = clampRaise(state, seat, state.currentBet + Math.round(0.75 * legal.potNow));
      return { action: { type: "raise", to }, reason: `Sube por valor: ${percent(equity)} de equity.` };
    }
    if (equity >= needed) {
      return {
        action: { type: "call" },
        reason: `Paga: necesita ${percent(needed)} y tiene ${percent(equity)}.`,
      };
    }
    if (
      legal.canRaise &&
      state.street !== "river" &&
      equity > 0.2 &&
      random() < style.bluff
    ) {
      const to = clampRaise(state, seat, state.currentBet + Math.round(0.7 * legal.potNow));
      return { action: { type: "raise", to }, reason: "Semi-farol con equity para mejorar." };
    }
    return {
      action: { type: "fold" },
      reason: `Se tira: necesita ${percent(needed)} y solo tiene ${percent(equity)}.`,
    };
  }

  if (legal.canRaise) {
    const potBet = Math.round((equity > gate ? 0.66 : 0.5) * legal.potNow);
    if (equity > gate && random() < 0.85) {
      return {
        action: { type: "raise", to: clampRaise(state, seat, potBet) },
        reason: `Apuesta por valor con ${percent(equity)}.`,
      };
    }
    if (equity < 0.35 && random() < style.bluff) {
      return {
        action: { type: "raise", to: clampRaise(state, seat, potBet) },
        reason: "Farol: el board no pega al rango que ha pagado.",
      };
    }
  }
  return { action: { type: "check" }, reason: `Pasa con ${percent(equity)} de equity.` };
}

const percent = (value: number): string => `${Math.round(value * 100)}%`;
