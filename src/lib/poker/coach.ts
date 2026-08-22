/**
 * El entrenador de la mesa jugable.
 *
 * Antes de cada decisión del jugador saca la misma cuenta que enseña el curso y
 * la deja en pantalla: preflop, el rango de la silla; del flop en adelante, la
 * equity contra los rivales que siguen vivos y el precio que le están poniendo.
 * Después compara lo que hizo con lo que decía el plan.
 *
 * No es un solver: es la tabla del curso, dicha en voz alta en el momento en el
 * que sirve para algo.
 */

import { RANKS, rankOf, SUIT_NAMES, suitOf, type Card } from "./cards";
import { describe as describeHand, evaluate } from "./evaluator";
import {
  BIG_BLIND,
  formatBB,
  legalMoves,
  type GameAction,
  type GameState,
} from "./game";
import { foldedToBlinds, preflopPlan, quickEquity, rivalsOf } from "./bot";
import { type HandCode } from "./notation";
import {
  actionSBUnopened,
  actionSBvsBBRaise,
  actionVs3Bet,
  actionVs4Bet,
  actionVsOpen,
  defenseFor,
  exploitAddFor,
  responseTo3Bet,
  responseTo4Bet,
  SB_UNOPENED,
  SB_VS_BB_RAISE,
} from "./preflop-tree";
import {
  breakevenBluff,
  callEV,
  formatPercent,
  impliedOddsNeeded,
  minimumDefenceFrequency,
  potOddsRatio,
  requiredEquity,
} from "./odds";
import {
  notationFor,
  percentFor,
  rangeFor,
  referenceSeat,
  type Action,
} from "./ranges";

export interface AdviceNumber {
  label: string;
  value: string;
  hint?: string;
}

export interface Advice {
  /** La recomendación en dos palabras: "Sube a 3bb", "Paga", "Tírala". */
  headline: string;
  action: GameAction;
  /** De dónde sale: el rango, la cuenta de pot odds... */
  source: string;
  /** El porqué, en una o dos frases del curso. */
  detail: string;
  numbers: AdviceNumber[];
  /** Equity simulada en el momento de la decisión. Preflop no se calcula. */
  equity?: number;
}

const actionKey = (action: GameAction): string =>
  action.type === "raise" ? "raise" : action.type;

/** ¿Hizo el jugador lo que decía el plan? Compara solo el tipo de acción. */
export function matchesAdvice(advice: Advice, played: GameAction): boolean {
  return actionKey(advice.action) === actionKey(played);
}

export function advise(state: GameState, seat: number): Advice {
  return state.street === "preflop" ? advisePreflop(state, seat) : advisePostflop(state, seat);
}

/* ----------------------------------------------------------------- preflop */

function advisePreflop(state: GameState, seat: number): Advice {
  const player = state.players[seat];
  const legal = legalMoves(state, seat);
  const plan = preflopPlan(state, seat);
  const numbers: AdviceNumber[] = [];

  if (state.raiseCount === 0) {
    numbers.push({
      label: "Rango de apertura",
      value: `${percentFor(player.position, "open", state.size).toFixed(0)}%`,
      hint: `de las 1326 combinaciones desde ${player.position}`,
    });
  }
  if (legal.callAmount > 0) {
    numbers.push({
      label: "Precio para igualar",
      value: formatBB(legal.callAmount),
      hint: `bote ${formatBB(legal.potNow)} · necesitas ${formatPercent(
        requiredEquity(legal.potNow, legal.callAmount),
        0,
      )}`,
    });
  }
  if (plan.notation) {
    numbers.push({ label: "La tabla dice", value: plan.notation });
  }

  const source = `${plan.spot} · ${player.position} en mesa de ${state.size}`;

  if (plan.action === "raise" || plan.action === "3bet" || plan.action === "4bet") {
    const to = Math.max(legal.minRaiseTo, Math.min(plan.raiseTo, legal.maxRaiseTo));
    const verb = plan.action === "raise" ? "Sube" : plan.action === "3bet" ? "Resube" : "4-bet";
    return {
      headline: legal.canRaise ? `${verb} a ${formatBB(to)}` : `Iguala: no queda para subir`,
      action: legal.canRaise ? { type: "raise", to } : { type: "call" },
      source,
      detail: plan.note,
      numbers,
    };
  }

  if (plan.action === "allin") {
    return {
      headline: "All-in",
      action: { type: "raise", to: legal.maxRaiseTo },
      source,
      detail: plan.note,
      numbers,
    };
  }

  if (plan.action === "call") {
    return {
      headline: legal.canCheck ? "Pasa y ve el flop" : `Paga ${formatBB(legal.callAmount)}`,
      action: legal.canCheck ? { type: "check" } : { type: "call" },
      source,
      detail: plan.note,
      numbers,
    };
  }

  return {
    headline: legal.canCheck ? "Pasa" : "Tírala",
    action: legal.canCheck ? { type: "check" } : { type: "fold" },
    source,
    detail: legal.canCheck
      ? "La mano no está en el rango, pero ya has puesto la ciega: se ve el flop gratis."
      : plan.note,
    numbers,
  };
}

/* ---------------------------------------------------------------- postflop */

function advisePostflop(state: GameState, seat: number): Advice {
  const player = state.players[seat];
  const legal = legalMoves(state, seat);
  const rivals = rivalsOf(state, seat);
  // Más iteraciones que los bots: esto se lo enseñamos al jugador.
  const { equity } = quickEquity(state, seat, 3000, (state.handNumber * 31 + seat + 7) | 0);
  const madeHand = describeHand(evaluate([...player.cards, ...state.board]));
  const source = `${madeHand} · ${rivals} ${rivals === 1 ? "rival" : "rivales"} en la mano`;

  const numbers: AdviceNumber[] = [
    {
      label: "Tu equity",
      value: formatPercent(equity, 0),
      hint: "simulada contra manos al azar de los que siguen",
    },
  ];

  if (legal.callAmount > 0) {
    const needed = requiredEquity(legal.potNow, legal.callAmount);
    const ev = callEV(equity, legal.potNow, legal.callAmount);
    numbers.push(
      {
        label: "Equity necesaria",
        value: formatPercent(needed, 0),
        hint: `pagas ${formatBB(legal.callAmount)} a un bote de ${formatBB(legal.potNow)} · ${potOddsRatio(
          legal.potNow,
          legal.callAmount,
        ).toFixed(1)} : 1`,
      },
      {
        label: "EV de igualar",
        value: `${ev >= 0 ? "+" : ""}${formatBB(Math.round(ev))}`,
        hint: ev >= 0 ? "a largo plazo, pagar gana dinero" : "a largo plazo, pagar pierde dinero",
      },
    );

    if (equity >= needed + 0.18 && equity > 0.6 && legal.canRaise) {
      const to = Math.max(
        legal.minRaiseTo,
        Math.min(state.currentBet + Math.round(0.75 * legal.potNow), legal.maxRaiseTo),
      );
      return {
        headline: `Sube a ${formatBB(to)}`,
        action: { type: "raise", to },
        source,
        detail:
          "Vas muy por delante del rango que apuesta: aquí no se paga, se sube. Igualar deja fuera el dinero que puedes cobrar en las calles que quedan.",
        numbers,
        equity,
      };
    }

    if (equity >= needed) {
      return {
        headline: `Paga ${formatBB(legal.callAmount)}`,
        action: { type: "call" },
        source,
        detail: `Necesitas ${formatPercent(needed, 0)} para que salga a cuenta y tienes ${formatPercent(
          equity,
          0,
        )}. Igualar es rentable aunque pierdas la mano muchas veces.`,
        numbers,
        equity,
      };
    }

    const implied = impliedOddsNeeded(legal.potNow, legal.callAmount, equity);
    return {
      headline: "Tírala",
      action: { type: "fold" },
      source,
      equity,
      detail:
        state.street === "river" || !Number.isFinite(implied)
          ? `Te falta equity: ${formatPercent(equity, 0)} contra ${formatPercent(needed, 0)} que pide el precio.`
          : `Te falta equity. Solo compensa si esperas sacarle otras ${formatBB(
              Math.round(implied),
            )} en las calles que quedan (implied odds).`,
      numbers,
    };
  }

  const bet = Math.round(0.66 * legal.potNow);
  numbers.push({
    label: "Si apuestas 2/3",
    value: formatPercent(breakevenBluff(legal.potNow, bet), 0),
    hint: `de las veces tiene que funcionar · él debe defender ${formatPercent(
      minimumDefenceFrequency(legal.potNow, bet),
      0,
    )}`,
  });

  if (equity > 0.62 && legal.canRaise) {
    const to = Math.max(legal.minRaiseTo, Math.min(bet, legal.maxRaiseTo));
    return {
      headline: `Apuesta ${formatBB(to)}`,
      action: { type: "raise", to },
      source,
      detail:
        "Tienes la mejor mano la mayoría de las veces: se apuesta por valor. Pasar aquí regala la calle y deja que ligue gratis.",
      numbers,
      equity,
    };
  }

  return {
    headline: "Pasa",
    action: { type: "check" },
    source,
    detail:
      equity < 0.35
        ? "Poca equity y sin iniciativa: pasar mantiene el bote pequeño con una mano que no quiere botes grandes."
        : "Mano media: apostar solo la paga lo que te gana. Se pasa y se decide en la siguiente calle.",
    numbers,
    equity,
  };
}

/* ------------------------------------------------------------------ faroles */

export type BluffVerdict = "farol" | "valor" | "no";

export interface BluffRead {
  verdict: BluffVerdict;
  /** Dos palabras: "Aquí se farolea", "Aquí se cobra", "Aquí no se miente". */
  headline: string;
  detail: string;
  /** Lo que tu mano le quita al rival. */
  blockers: string[];
  /** Lo que has visto de los que siguen en la mano. */
  reads: string[];
  numbers: AdviceNumber[];
}

/** El palo que puede hacer color en el board, si hay tres o más. */
function flushSuitOnBoard(board: readonly Card[]): number | null {
  const counts = [0, 0, 0, 0];
  for (const card of board) counts[suitOf(card)] += 1;
  const suit = counts.findIndex((count) => count >= 3);
  return suit === -1 ? null : suit;
}

/** Lo que tu mano le quita al rango del rival. */
function blockersOf(cards: readonly Card[], board: readonly Card[]): string[] {
  const out: string[] = [];
  const ranks = cards.map(rankOf);

  if (board.length === 0) {
    if (ranks.includes(12)) {
      out.push(
        "Llevas un as: le quitas la mitad de las combinaciones de A-A y un cuarto de las de A-K.",
      );
    }
    if (ranks.includes(11)) out.push("Llevas un rey: le quitas la mitad de las K-K.");
    return out;
  }

  const suit = flushSuitOnBoard(board);
  if (suit !== null) {
    const mine = cards.filter((card) => suitOf(card) === suit);
    const nut = mine.find((card) => rankOf(card) === 12);
    if (nut) {
      out.push(
        `Tienes el as de ${SUIT_NAMES[suit].toLowerCase()}: el color máximo no lo puede tener nadie más que tú.`,
      );
    } else if (mine.length > 0) {
      out.push(
        `Tienes una carta de ${SUIT_NAMES[suit].toLowerCase()}: hay menos colores posibles en su rango.`,
      );
    }
  }

  const topBoard = Math.max(...board.map(rankOf));
  if (ranks.includes(topBoard)) {
    out.push(`Llevas un ${RANKS[topBoard]}: le quitas parte de la pareja máxima.`);
  }
  return out;
}

/**
 * Cuándo mentir y cuándo no, con la cuenta delante.
 *
 * Tres cosas mandan, y en este orden: cuánta gente queda (un farol tiene que
 * funcionar contra todos a la vez), a quién le estás faroleando (a la estación
 * no se le echa del bote) y qué le quita tu mano a su rango.
 */
export function bluffRead(state: GameState, seat: number): BluffRead {
  const player = state.players[seat];
  const legal = legalMoves(state, seat);
  const rivals = state.players.filter(
    (other) => other.seat !== seat && !other.folded,
  );
  const bet = Math.max(BIG_BLIND, Math.round(0.66 * legal.potNow));
  const foldEquity = breakevenBluff(legal.potNow, bet);
  const blockers = blockersOf(player.cards, state.board);
  const reads: string[] = [];
  const numbers: AdviceNumber[] = [
    {
      label: "Tiene que funcionar",
      value: formatPercent(foldEquity, 0),
      hint: `de las veces, apostando ${formatBB(bet)} a un bote de ${formatBB(legal.potNow)}`,
    },
    {
      label: "Él debería defender",
      value: formatPercent(minimumDefenceFrequency(legal.potNow, bet), 0),
      hint: "si defiende menos que eso, farolear es dinero gratis",
    },
    { label: "Rivales en la mano", value: String(rivals.length) },
  ];

  const nadieSuelta = rivals.filter(
    (rival) => rival.style === "estación" || rival.style === "flojo",
  );
  for (const rival of nadieSuelta) {
    reads.push(`${rival.name} paga de más: contra él se gana cobrando, no mintiendo.`);
  }

  const equity =
    state.board.length > 0 ? quickEquity(state, seat, 1200, (state.handNumber * 41 + seat) | 0).equity : 0;

  if (state.board.length > 0) {
    numbers.push({ label: "Tu equity", value: formatPercent(equity, 0) });
  }

  // Preflop el farol es el 3-bet ligero, y ahí lo que manda son los blockers.
  if (state.street === "preflop") {
    const puedeResubir = state.raiseCount >= 1 && legal.canRaise;
    if (!puedeResubir) {
      return {
        verdict: "no",
        headline: "Todavía no hay nada que farolear",
        detail:
          "Sin subida delante no hay farol posible: abrir el bote es abrir, no mentir. El farol preflop es el 3-bet ligero.",
        blockers,
        reads,
        numbers,
      };
    }
    if (nadieSuelta.length > 0) {
      return {
        verdict: "no",
        headline: "Aquí no se resube de farol",
        detail:
          "El 3-bet de farol vive de que se tiren. Contra quien paga por sistema, el 3-bet solo sirve con manos que quieren un bote grande.",
        blockers,
        reads,
        numbers,
      };
    }
    return {
      verdict: blockers.length > 0 ? "farol" : "no",
      headline: blockers.length > 0 ? "Mano de 3-bet ligero" : "Sin blockers, mejor tirarla",
      detail:
        blockers.length > 0
          ? "Los 3-bets de farol se eligen por lo que le quitan, no por lo bonitas que son: A-5s y A-4s bloquean sus ases y encima ligan la escalera baja. A-10s parece mejor mano y es peor sitio, porque su rango de continuar te domina."
          : "Un 3-bet de farol sin blockers es dinero al aire: si te vuelve a subir, no tienes ni mano ni información.",
      blockers,
      reads,
      numbers,
    };
  }

  if (!legal.canRaise) {
    return {
      verdict: "no",
      headline: "No queda con qué apostar",
      detail: "Sin fichas detrás no hay farol: la decisión es pagar o tirar con lo que tienes.",
      blockers,
      reads,
      numbers,
    };
  }

  if (equity >= 0.62) {
    return {
      verdict: "valor",
      headline: "Aquí se cobra, no se miente",
      detail:
        "Tienes la mejor mano la mayoría de las veces. Apuestas por valor: quieres que pague, no que se tire.",
      blockers,
      reads,
      numbers,
    };
  }

  if (rivals.length > 1) {
    return {
      verdict: "no",
      headline: "Multiway: no se farolea",
      detail: `El farol tiene que funcionar contra ${rivals.length} manos a la vez. Con uno solo que pague, se acabó. En bote multiway se apuesta con mano, no con historia.`,
      blockers,
      reads,
      numbers,
    };
  }

  if (nadieSuelta.length > 0) {
    return {
      verdict: "no",
      headline: "A este rival no se le echa",
      detail:
        "Paga demasiado: el farol necesita que se tire y él no se tira. Guarda las fichas para cuando tengas mano y cóbrasela.",
      blockers,
      reads,
      numbers,
    };
  }

  const hayProyecto = equity >= 0.25;
  if (blockers.length > 0 || hayProyecto) {
    return {
      verdict: "farol",
      headline: "Sitio para farolear",
      detail: hayProyecto
        ? `Semi-farol: si te pagan todavía puedes ligar. Necesitas que se tire ${formatPercent(
            foldEquity,
            0,
          )} de las veces, y encima tienes salidas cuando no funciona.`
        : `Farol limpio: le quitas parte de las manos con las que te pagaría y solo necesitas que suelte ${formatPercent(
            foldEquity,
            0,
          )} de las veces.`,
      blockers,
      reads,
      numbers,
    };
  }

  return {
    verdict: "no",
    headline: "Mano equivocada para mentir",
    detail:
      "Ni bloqueas sus manos buenas ni tienes salidas para cuando te paguen. Se farolea con las manos que no valen nada pero le quitan algo, no con las que todavía pueden ganar el bote pasando.",
    blockers,
    reads,
    numbers,
  };
}

/* --------------------------------------------------------- el rango del spot */

export interface SpotRange {
  /** El sitio, en una línea: "Abres desde CO", "BTN contra la subida de UTG". */
  label: string;
  /** La notación exacta, cuando el spot tiene una tabla detrás. */
  notation?: string;
  /** Qué hace la tabla con cada una de las 169 manos. */
  actionFor: (hand: HandCode) => Action;
  /** Las acciones que aparecen, para pintar la leyenda. */
  legend: Action[];
}

/**
 * La tabla que manda en la decisión que tienes delante, lista para pintarla en
 * la rejilla de 13x13. Del flop en adelante no hay tabla: ahí manda la equity.
 */
export function spotRange(state: GameState, seat: number): SpotRange | null {
  if (state.street !== "preflop") return null;
  const player = state.players[seat];
  const position = player.position;
  const opener = state.aggressor === null ? null : state.players[state.aggressor].position;

  if (state.raiseCount === 0 && position === "SB" && foldedToBlinds(state, seat)) {
    return {
      label: "Te llega el bote sin subir en la ciega pequeña",
      notation: `${SB_UNOPENED.raise} (subir) · limp con el resto del rango`,
      actionFor: actionSBUnopened,
      legend: ["raise", "call", "fold"],
    };
  }

  if (state.raiseCount === 1 && position === "SB" && opener === "BB" && player.lastAction === "call") {
    return {
      label: "Limpeaste y la ciega grande sube",
      notation: SB_VS_BB_RAISE.threeBet,
      actionFor: actionSBvsBBRaise,
      legend: ["3bet", "call", "fold"],
    };
  }

  if (state.raiseCount === 0 || opener === null) {
    const open = rangeFor(position, "open", state.size);
    const extra = exploitAddFor(referenceSeat(position, state.size));
    return {
      label: `Abres el bote desde ${position}`,
      notation: notationFor(position, "open", state.size),
      actionFor: (hand) => (open.has(hand) ? "raise" : extra.has(hand) ? "extra" : "fold"),
      legend: ["raise", "extra", "fold"],
    };
  }

  if (state.raiseCount === 1) {
    const defense = defenseFor(position, opener);
    return {
      label: `${position} contra la subida de ${opener}`,
      notation: defense ? `${defense.threeBet} (3-bet) · ${defense.call} (call)` : undefined,
      actionFor: (hand) => actionVsOpen(position, opener, hand),
      legend: ["3bet", "call", "fold"],
    };
  }

  const iOpened = player.lastAction === "raise" || player.lastAction === "bet";
  if (state.raiseCount === 2 && iOpened) {
    const response = responseTo3Bet(position, opener);
    return {
      label: `Abriste y ${opener} te resube`,
      notation: response ? `${response.fourBet} (4-bet) · ${response.call} (call)` : undefined,
      actionFor: (hand) => actionVs3Bet(position, opener, hand),
      legend: ["4bet", "call", "fold"],
    };
  }

  const response = responseTo4Bet(opener);
  return {
    label: state.raiseCount === 2 ? `Hay subida y 3-bet delante` : `Te han 4-beteado`,
    notation: `${response.jam} (all-in) · ${response.call} (call)`,
    actionFor: (hand) => actionVs4Bet(opener, hand),
    legend: ["allin", "call", "fold"],
  };
}
