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

import { describe as describeHand, evaluate } from "./evaluator";
import {
  formatBB,
  legalMoves,
  type GameAction,
  type GameState,
} from "./game";
import { preflopPlan, quickEquity, rivalsOf } from "./bot";
import {
  breakevenBluff,
  callEV,
  formatPercent,
  impliedOddsNeeded,
  minimumDefenceFrequency,
  potOddsRatio,
  requiredEquity,
} from "./odds";
import { percentFor } from "./ranges";

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
      };
    }

    const implied = impliedOddsNeeded(legal.potNow, legal.callAmount, equity);
    return {
      headline: "Tírala",
      action: { type: "fold" },
      source,
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
  };
}
