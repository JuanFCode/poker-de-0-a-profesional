/**
 * Matemática de bote: pot odds, outs, EV y frecuencias.
 * Todo en fracciones 0..1 salvo donde el nombre diga "Percent".
 */

export type Street = "flop" | "turn";

const combinations = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return result;
};

/**
 * Equity que necesitas para que igualar sea rentable.
 *
 * `pot` es el bote **tal como está antes de tu call, con la apuesta del rival ya dentro**.
 * Pagas `call` para llevarte `pot + call`, así que el precio es call / (pot + call).
 *
 * Ejemplo: bote de 100, el rival apuesta 50 -> pot = 150, call = 50 -> 25%.
 */
export function requiredEquity(pot: number, call: number): number {
  if (call <= 0) return 0;
  return call / (pot + call);
}

/** Las pot odds en formato "3 : 1" (mismo criterio de `pot` que arriba). */
export function potOddsRatio(pot: number, call: number): number {
  if (call <= 0) return Infinity;
  return pot / call;
}

/** Cartas que quedan por ver desde cada calle (52 - 2 tuyas - board). */
export const UNSEEN: Record<Street, number> = { flop: 47, turn: 46 };

/**
 * Probabilidad real de ligar al menos un out.
 * Desde el flop cuentan turn y river; desde el turn, solo el river.
 */
export function equityFromOuts(outs: number, street: Street): number {
  const unseen = UNSEEN[street];
  const clean = Math.max(0, Math.min(outs, unseen));
  if (street === "turn") return clean / unseen;
  return 1 - combinations(unseen - clean, 2) / combinations(unseen, 2);
}

/**
 * La regla del 2 y el 4, que es la aproximación que se usa en la mesa:
 * outs x 4 desde el flop, outs x 2 desde el turn.
 */
export function ruleOf2and4(outs: number, street: Street): number {
  return Math.min(1, (outs * (street === "flop" ? 4 : 2)) / 100);
}

/** EV de igualar: ganas el bote+call cuando ligas, pierdes el call cuando no. */
export function callEV(equity: number, pot: number, call: number): number {
  return equity * pot - (1 - equity) * call;
}

/**
 * Cuántas veces tiene que funcionar un farol para no perder dinero.
 * Apostar `bet` a un bote de `pot`: bet / (pot + bet).
 */
export function breakevenBluff(pot: number, bet: number): number {
  if (bet <= 0) return 0;
  return bet / (pot + bet);
}

/**
 * MDF (minimum defence frequency): con qué frecuencia debe defender el rival
 * para que apostar cualquier basura no sea automáticamente rentable.
 */
export function minimumDefenceFrequency(pot: number, bet: number): number {
  return pot / (pot + bet);
}

/**
 * Implied odds: cuánto más tienes que ganar en calles futuras para que igualar
 * salga a cuenta con la equity que tienes ahora. 0 si ya es rentable.
 */
export function impliedOddsNeeded(pot: number, call: number, equity: number): number {
  if (equity <= 0) return Infinity;
  const needed = (call * (1 - equity)) / equity - pot;
  return Math.max(0, needed);
}

/** Outs típicos de los proyectos más comunes, para tenerlos a mano. */
export const COMMON_DRAWS: { name: string; outs: number; note: string }[] = [
  { name: "Proyecto de color", outs: 9, note: "4 del mismo palo, quedan 9 en la baraja" },
  { name: "Escalera abierta", outs: 8, note: "Ligas por los dos extremos" },
  { name: "Color + escalera abierta", outs: 15, note: "Monstruo: favorito contra una pareja" },
  { name: "Escalera interior (gutshot)", outs: 4, note: "Solo una carta te sirve" },
  { name: "Dos overcards", outs: 6, note: "Emparejar cualquiera de las dos" },
  { name: "Pareja a trío (set)", outs: 2, note: "Por eso las parejas bajas quieren precio barato" },
  { name: "Trío a full o póker", outs: 7, note: "3 para el póker por el rango, 6 para el full" },
];

export const formatPercent = (value: number, digits = 1): string =>
  `${(value * 100).toFixed(digits)}%`;
