/**
 * Las fugas: qué error acabas de cometer y dónde se estudia.
 *
 * El entrenador ya dice, antes de cada decisión, lo que dice el plan. Esto es
 * lo que pasa **después**: cuando lo que juegas no es lo que decía el plan, se
 * mira *en qué* te desviaste. No todas las desviaciones son iguales —abrir una
 * mano de más no es lo mismo que pagar un river sin precio— y solo repitiendo
 * la misma categoría muchas veces se ve una fuga de verdad.
 *
 * Cada categoría lleva la corrección en una línea y el enlace a la lección que
 * la explica entera, para que el error lleve a estudiar y no solo a fastidiarse.
 */

import { type Advice } from "./coach";
import { legalMoves, type GameAction, type GameState } from "./game";
import { handCodeOf, type HandCode } from "./notation";
import { requiredEquity } from "./odds";
import { zoneOf } from "./preflop-tree";

export type LeakId =
  | "abrir-fuera-de-rango"
  | "limp-fuera-de-plan"
  | "pagar-offsuit-contra-temprana"
  | "4bet-con-jj-qq"
  | "pagar-sin-precio"
  | "tirar-con-precio"
  | "no-defender-la-ciega"
  | "farol-multiway"
  | "farol-contra-estacion"
  | "pasar-una-mano-hecha";

export interface Leak {
  id: LeakId;
  /** El error, tal y como se llamaría en una sesión de estudio. */
  title: string;
  /** Qué habrías tenido que hacer, en una línea. */
  fix: string;
  /** La lección del temario que lo explica. */
  lesson: string;
  lessonLabel: string;
}

const LEAKS: Record<LeakId, Omit<Leak, "id">> = {
  "abrir-fuera-de-rango": {
    title: "Abres manos que no están en el rango",
    fix: "Desde esa silla quedan demasiadas manos por detrás: abre solo lo que aguanta un 3-bet.",
    lesson: "/curso/preflop/rangos-de-apertura",
    lessonLabel: "Rangos de apertura",
  },
  "limp-fuera-de-plan": {
    title: "Entras pagando en vez de subir",
    fix: "Si la mano vale, se abre subiendo. El limp solo tiene sitio desde la ciega pequeña.",
    lesson: "/curso/preflop/limpers-e-isolar",
    lessonLabel: "Limpers: cómo se castiga al que iguala",
  },
  "pagar-offsuit-contra-temprana": {
    title: "Pagas manos offsuit contra una apertura temprana",
    fix: "Contra un rango fuerte, A-10o o K-J ligan pareja dominada. Suited o nada.",
    lesson: "/curso/preflop/suited-vs-offsuit",
    lessonLabel: "Suited manda",
  },
  "4bet-con-jj-qq": {
    title: "4-beteas con J-J o Q-Q",
    fix: "Si mete el stack, o estás dominado o estás en moneda al aire. Se paga y se ve el flop.",
    lesson: "/curso/preflop/squeeze-y-4-bet",
    lessonLabel: "Squeeze y 4-bet",
  },
  "pagar-sin-precio": {
    title: "Pagas sin que el precio te lo permita",
    fix: "Compara lo que pagas con el bote: si necesitas más equity de la que tienes, es tirar.",
    lesson: "/curso/matematicas/pot-odds-y-outs",
    lessonLabel: "Pot odds y outs",
  },
  "tirar-con-precio": {
    title: "Tiras manos que el precio hacía rentables",
    fix: "Con esas pot odds no hace falta ganar casi nunca para que igualar salga a cuenta.",
    lesson: "/curso/matematicas/pot-odds-y-outs",
    lessonLabel: "Pot odds y outs",
  },
  "no-defender-la-ciega": {
    title: "No defiendes la ciega grande",
    fix: "Ya has puesto una ciega y te dan precio: tirarlo todo desde la ciega grande regala dinero.",
    lesson: "/curso/preflop/defender-las-ciegas",
    lessonLabel: "Defender las ciegas",
  },
  "farol-multiway": {
    title: "Faroleas en botes multiway",
    fix: "El farol tiene que funcionar contra todos a la vez. Con dos o más rivales, se apuesta con mano.",
    lesson: "/curso/postflop/botes-multiway",
    lessonLabel: "Botes multiway",
  },
  "farol-contra-estacion": {
    title: "Faroleas a quien no se tira nunca",
    fix: "Contra un rival que paga de más se gana cobrando las manos buenas, no intentando echarlo.",
    lesson: "/curso/postflop/bluffs-y-blockers",
    lessonLabel: "Faroles y blockers",
  },
  "pasar-una-mano-hecha": {
    title: "Pasas con la mejor mano",
    fix: "Con ventaja clara se apuesta: pasar regala la calle y deja que ligue gratis.",
    lesson: "/curso/postflop/c-bet",
    lessonLabel: "La continuación (c-bet)",
  },
};

export const leakInfo = (id: LeakId): Leak => ({ id, ...LEAKS[id] });

const isOffsuit = (hand: HandCode): boolean => hand.endsWith("o");
const isJJorQQ = (hand: HandCode): boolean => hand === "JJ" || hand === "QQ";

/**
 * Clasifica lo que acabas de hacer contra lo que decía el plan.
 *
 * Se llama **antes** de aplicar la acción: el estado todavía es el de la
 * decisión. Devuelve `null` cuando la jugada sigue el plan o cuando la
 * desviación no encaja en ninguna categoría cerrada: no se inventa una fuga
 * para cada mano jugada de otra manera.
 */
export function classifyLeak(
  state: GameState,
  seat: number,
  advice: Advice,
  played: GameAction,
): Leak | null {
  const player = state.players[seat];
  const legal = legalMoves(state, seat);
  const planned = advice.action.type === "raise" ? "raise" : advice.action.type;
  const done = played.type === "raise" ? "raise" : played.type;
  if (planned === done) return null;

  const hand: HandCode | null =
    player.cards.length === 2 ? handCodeOf(player.cards[0], player.cards[1]) : null;

  if (state.street === "preflop" && hand) {
    if (done === "raise" && state.raiseCount === 0 && planned === "fold") {
      return leakInfo("abrir-fuera-de-rango");
    }
    if (done === "call" && state.raiseCount === 0 && player.position !== "SB") {
      return leakInfo("limp-fuera-de-plan");
    }
    if (done === "raise" && state.raiseCount === 2 && isJJorQQ(hand)) {
      return leakInfo("4bet-con-jj-qq");
    }
    if (done === "call" && planned === "fold" && state.raiseCount === 1 && isOffsuit(hand)) {
      const opener = state.aggressor === null ? null : state.players[state.aggressor].position;
      if (opener && zoneOf(opener) === "temprana") {
        return leakInfo("pagar-offsuit-contra-temprana");
      }
    }
    if (done === "fold" && planned !== "fold" && player.position === "BB") {
      return leakInfo("no-defender-la-ciega");
    }
  }

  if (legal.callAmount > 0 && advice.equity !== undefined) {
    const needed = requiredEquity(legal.potNow, legal.callAmount);
    if (done === "call" && advice.equity + 0.05 < needed) return leakInfo("pagar-sin-precio");
    if (done === "fold" && advice.equity > needed + 0.05) return leakInfo("tirar-con-precio");
  }

  if (state.street !== "preflop" && done === "raise" && advice.equity !== undefined) {
    const rivals = state.players.filter((other) => other.seat !== seat && !other.folded);
    if (advice.equity < 0.5) {
      if (rivals.length > 1) return leakInfo("farol-multiway");
      if (rivals.some((rival) => rival.style === "estación" || rival.style === "flojo")) {
        return leakInfo("farol-contra-estacion");
      }
    }
  }

  if (
    state.street !== "preflop" &&
    done === "check" &&
    planned === "raise" &&
    (advice.equity ?? 0) > 0.6
  ) {
    return leakInfo("pasar-una-mano-hecha");
  }

  return null;
}

/** Lo que se guarda en el navegador: cuántas veces has cometido cada fuga. */
export type LeakCounts = Partial<Record<LeakId, number>>;

export interface RankedLeak extends Leak {
  count: number;
}

/** Las fugas más repetidas primero: es lo único que merece la pena estudiar. */
export function topLeaks(counts: LeakCounts, limit = 3): RankedLeak[] {
  return (Object.entries(counts) as [LeakId, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ ...leakInfo(id), count }));
}
