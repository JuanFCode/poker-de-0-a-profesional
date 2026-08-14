/**
 * Gestión de bankroll y estadísticas de sesión.
 *
 * La regla de fondo es siempre la misma: cuanta más varianza tiene el formato,
 * más buy-ins necesitas para que una mala racha normal no te deje sin dinero.
 * Los números son los estándar de la industria (Clarke, "The Grinder's Manual";
 * y la regla clásica de 100 buy-ins para torneos).
 */

export type Format = "cash" | "mtt" | "sng" | "spin";

export interface FormatRule {
  format: Format;
  label: string;
  /** Buy-ins recomendados para jugar ese nivel con tranquilidad. */
  buyIns: number;
  /** Mínimo con el que se puede jugar asumiendo más riesgo. */
  minBuyIns: number;
  note: string;
}

export const BANKROLL_RULES: Record<Format, FormatRule> = {
  cash: {
    format: "cash",
    label: "Cash game",
    buyIns: 50,
    minBuyIns: 30,
    note: "50 buy-ins de 100bb. Con 30 puedes jugar, pero vas a sentir cada downswing.",
  },
  mtt: {
    format: "mtt",
    label: "Torneos (MTT)",
    buyIns: 200,
    minBuyIns: 100,
    note: "El formato de más varianza: campos grandes, premios concentrados arriba y rachas de 200 torneos sin mesa final.",
  },
  sng: {
    format: "sng",
    label: "Sit & Go",
    buyIns: 100,
    minBuyIns: 50,
    note: "Menos varianza que un MTT porque paga a más gente en proporción, pero sigue siendo torneo.",
  },
  spin: {
    format: "spin",
    label: "Spin & Go",
    buyIns: 250,
    minBuyIns: 150,
    note: "Los multiplicadores altos son casi todo tu beneficio y salen muy de vez en cuando.",
  },
};

export const FORMAT_LIST = Object.values(BANKROLL_RULES);

export interface Session {
  id: string;
  /** ISO (yyyy-mm-dd). */
  date: string;
  format: Format;
  /** Texto libre: "NL10", "MTT 5€", "Spin 3€". */
  stakes: string;
  /** Ciega grande en dinero. Necesaria para el win-rate en bb/100. */
  bigBlind: number;
  buyIn: number;
  cashOut: number;
  hours: number;
  hands: number;
  notes?: string;
}

export const sessionProfit = (session: Session): number => session.cashOut - session.buyIn;

export interface BankrollSummary {
  count: number;
  profit: number;
  hours: number;
  hands: number;
  /** Ganancia por hora en dinero. */
  perHour: number;
  /** Ciegas grandes ganadas cada 100 manos: la métrica estándar en cash. */
  bbPer100: number | null;
  winningSessions: number;
  bestSession: number;
  worstSession: number;
  /** Peor caída acumulada desde un máximo, en dinero. */
  maxDrawdown: number;
  /** Curva acumulada para el gráfico. */
  curve: { index: number; date: string; total: number }[];
}

export function summarize(sessions: Session[]): BankrollSummary {
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  let profit = 0;
  let hours = 0;
  let hands = 0;
  let bbWon = 0;
  let bbHands = 0;
  let winning = 0;
  let best = 0;
  let worst = 0;
  let peak = 0;
  let drawdown = 0;

  const curve: BankrollSummary["curve"] = [];

  ordered.forEach((session, index) => {
    const result = sessionProfit(session);
    profit += result;
    hours += session.hours;
    hands += session.hands;
    if (result > 0) winning++;
    if (result > best) best = result;
    if (result < worst) worst = result;
    if (session.bigBlind > 0 && session.hands > 0) {
      bbWon += result / session.bigBlind;
      bbHands += session.hands;
    }
    peak = Math.max(peak, profit);
    drawdown = Math.max(drawdown, peak - profit);
    curve.push({ index: index + 1, date: session.date, total: profit });
  });

  return {
    count: ordered.length,
    profit,
    hours,
    hands,
    perHour: hours > 0 ? profit / hours : 0,
    bbPer100: bbHands > 0 ? (bbWon / bbHands) * 100 : null,
    winningSessions: winning,
    bestSession: best,
    worstSession: worst,
    maxDrawdown: drawdown,
    curve,
  };
}

export type RollLevel = "ok" | "justo" | "riesgo";

export interface RollCheck {
  level: RollLevel;
  buyInsHeld: number;
  recommended: number;
  minimum: number;
  message: string;
}

/** ¿Puedes permitirte ese nivel con el bankroll que tienes? */
export function checkBankroll(bankroll: number, buyIn: number, format: Format): RollCheck {
  const rule = BANKROLL_RULES[format];
  const held = buyIn > 0 ? bankroll / buyIn : 0;

  if (held >= rule.buyIns) {
    return {
      level: "ok",
      buyInsHeld: held,
      recommended: rule.buyIns,
      minimum: rule.minBuyIns,
      message: `Tienes ${held.toFixed(0)} buy-ins: puedes jugar este nivel sin pensar en el dinero.`,
    };
  }
  if (held >= rule.minBuyIns) {
    return {
      level: "justo",
      buyInsHeld: held,
      recommended: rule.buyIns,
      minimum: rule.minBuyIns,
      message: `${held.toFixed(0)} buy-ins: vas justo. Juega este nivel solo si puedes bajar en cuanto pierdas.`,
    };
  }
  return {
    level: "riesgo",
    buyInsHeld: held,
    recommended: rule.buyIns,
    minimum: rule.minBuyIns,
    message: `${held.toFixed(0)} buy-ins: estás jugando por encima de tu bankroll. Baja de nivel.`,
  };
}

/** Buy-in máximo que te puedes permitir hoy en cada formato. */
export function maxBuyIn(bankroll: number, format: Format): number {
  return bankroll / BANKROLL_RULES[format].buyIns;
}
