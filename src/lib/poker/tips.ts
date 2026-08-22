/**
 * Los consejos de mesa, dichos en el momento en el que sirven.
 *
 * Salen de los charts de cash en vivo de Jonathan Little (pokercoaching.com) y
 * de la charla en la que los repasa. No son reglas cerradas: son las frases que
 * un jugador que ya gana repite mientras juega, y que aquí aparecen cuando la
 * mesa las pide.
 */

import { BIG_BLIND, type GameState } from "./game";
import { handCodeOf } from "./notation";
import { zoneOf } from "./preflop-tree";

export type TipTrigger =
  | "sb-sin-subir"
  | "limpers"
  | "vs-temprana"
  | "vs-3bet"
  | "vs-4bet"
  | "multiway"
  | "mano-offsuit"
  | "apertura-grande"
  | "mesa-floja"
  | "rastrillo"
  | "posicion"
  | "profundo"
  | "cabeza"
  | "general";

export interface Tip {
  id: string;
  trigger: TipTrigger;
  text: string;
  /** La lección donde se estudia entero, si la hay. */
  lesson?: string;
}

export const TIPS: Tip[] = [
  {
    id: "suited-manda",
    trigger: "mano-offsuit",
    text: "K-8s se abre desde posición temprana; K-8o no se abre ni desde el botón. El color no es solo equity: es una calle más de farol y la posibilidad de hacer una mano de la que cobrar un stack.",
    lesson: "/curso/preflop/suited-vs-offsuit",
  },
  {
    id: "dominacion",
    trigger: "vs-3bet",
    text: "Contra un 3-bet, 9-8s vale más que A-10s aunque parezca peor mano: cuando ligas pareja de ases con A-10, su as es mejor que el tuyo. Estar dominado es el desastre más caro del hold'em.",
    lesson: "/curso/preflop/cuando-ya-han-subido",
  },
  {
    id: "no-4bet-jj",
    trigger: "vs-3bet",
    text: "Casi nadie juega bien esto: no se 4-betea J-J ni Q-Q. Si mete el stack, o te domina (A-A, K-K, Q-Q) o estás en moneda al aire contra A-K. Se paga y se ve el flop.",
    lesson: "/curso/preflop/squeeze-y-4-bet",
  },
  {
    id: "blockers-a5s",
    trigger: "vs-temprana",
    text: "Los 3-bets de farol se eligen por lo que le quitan: A-5s le borra la mitad de las A-A y un cuarto de las A-K, y encima liga la escalera baja. A-10s parece mejor mano y es peor sitio.",
    lesson: "/curso/postflop/bluffs-y-blockers",
  },
  {
    id: "3bet-oop-mas-grande",
    trigger: "posicion",
    text: "Fuera de posición se resube más grande. Un bote mayor deja menos stack detrás, y con menos stack detrás su posición vale menos: le estás comprando parte de su ventaja.",
    lesson: "/curso/preflop/3-bet",
  },
  {
    id: "slowplay-aa",
    trigger: "vs-4bet",
    text: "En posición, contra un 4-bet se iguala con A-A en vez de meterla. Si siempre la metes, tu rango de call se queda flojo y él apuesta el flop sin miedo; dejándola dentro, su c-bet nunca es gratis.",
    lesson: "/curso/preflop/squeeze-y-4-bet",
  },
  {
    id: "tight-mas-tight",
    trigger: "general",
    text: "El ajuste que casi todo el mundo hace al revés: contra rivales cerrados se juega más cerrado, no más ancho. Contra un rango que solo trae manos buenas no hay manos marginales rentables.",
    lesson: "/curso/preflop/ajustes",
  },
  {
    id: "apertura-grande",
    trigger: "apertura-grande",
    text: "Cuando abren a 5bb en vez de a 3bb, defiendes bastante menos. Arriesgar mucho para ganar poco solo se hace con rango fuerte, y encima tú pagas peor precio.",
    lesson: "/curso/preflop/cuando-ya-han-subido",
  },
  {
    id: "multiway",
    trigger: "multiway",
    text: "Las tablas presuponen un bote a dos. Si va subida, pago y pago, el sitio es otro: la mano media pierde valor, el farol casi desaparece y la posición pesa el doble.",
    lesson: "/curso/postflop/botes-multiway",
  },
  {
    id: "k8o",
    trigger: "multiway",
    text: "El error clásico en vivo, en tres pasos: limpear K-8o, pagar la subida y subir en K-Q-6. Cada paso multiplica el anterior. La mano se podía tirar tres veces.",
    lesson: "/curso/postflop/botes-multiway",
  },
  {
    id: "chop",
    trigger: "sb-sin-subir",
    text: "En una sala con rastrillo, repartir la ciega pequeña suele ser la mejor jugada del día: un bote de dos ciegas paga un porcentaje enorme para lo poco que hay dentro.",
    lesson: "/curso/profesional/el-rastrillo",
  },
  {
    id: "sb-4bb",
    trigger: "sb-sin-subir",
    text: "Desde la ciega pequeña se abre a 4bb, no a 3bb: aquí no te importa que se retire, y con el bote más grande el rastrillo topa antes del flop. El resto de la mano se juega casi sin rastrillo.",
    lesson: "/curso/profesional/el-rastrillo",
  },
  {
    id: "limp-protegido",
    trigger: "sb-sin-subir",
    text: "Si desde la ciega pequeña subes con todo lo bueno y limpeas solo lo malo, tu limp queda marcado y te suben encima cada vez. Por eso el limp lleva también parejas medias y manos decentes.",
    lesson: "/curso/preflop/limpers-e-isolar",
  },
  {
    id: "isolar-limpers",
    trigger: "limpers",
    text: "Con limpers delante se sube más grande (5bb y una más por cada limper) y con rango más cerrado: hay más dinero muerto, pero también más gente a la que hacer tirar.",
    lesson: "/curso/preflop/limpers-e-isolar",
  },
  {
    id: "rastrillo-torneo",
    trigger: "rastrillo",
    text: "Los rangos de torneo son más anchos que los de cash por dos razones: hay ante y no hay rastrillo. Cuanto más grande es el bote antes de repartir, más vale la pena pelearlo.",
    lesson: "/curso/profesional/el-rastrillo",
  },
  {
    id: "estacion",
    trigger: "mesa-floja",
    text: "Busca al que paga de más y juega manos con él. Contra una estación se gana cobrando fino con manos buenas, no intentando echarlo del bote.",
    lesson: "/curso/profesional/seleccion-de-mesa",
  },
  {
    id: "no-donk",
    trigger: "posicion",
    text: "Fuera de posición y profundo casi no se lidera: apostar primero con el bote grande detrás es la manera más rápida de jugar mal el resto de la mano.",
    lesson: "/curso/postflop/tamanos",
  },
  {
    id: "profundo",
    trigger: "profundo",
    text: "Cuanto más profundo se juega, más valen las manos que pueden hacer la nuts y menos las que solo hacen pareja alta. Suited arriba, offsuit abajo.",
    lesson: "/curso/preflop/suited-vs-offsuit",
  },
  {
    id: "fichas-mesa",
    trigger: "general",
    text: "Las fichas se mueven hacia la izquierda: quieres cubrir a los de tu derecha y que los de tu izquierda no te cubran. Y si recompras, recompra en el botón.",
    lesson: "/curso/profesional/seleccion-de-mesa",
  },
  {
    id: "expectativas",
    trigger: "cabeza",
    text: "No se juega esperando ganar hoy: se juega para jugar bien hoy. Quien va a la mesa esperando resultado se rompe con la primera racha mala.",
    lesson: "/curso/bankroll/tilt",
  },
  {
    id: "no-imitar",
    trigger: "cabeza",
    text: "No copies a los regulares de tu partida. Si estuvieran ganando de verdad, habrían subido de límite.",
    lesson: "/curso/profesional/medir-tu-juego",
  },
  {
    id: "tabla-guia",
    trigger: "general",
    text: "Las tablas son el punto de partida, no el objetivo. El dinero está en ver qué hace mal cada rival y desviarse por esa razón, no porque la mano sea vistosa.",
    lesson: "/curso/profesional/gto-vs-explotativo",
  },
];

const byTrigger = (trigger: TipTrigger): Tip[] => TIPS.filter((tip) => tip.trigger === trigger);

/** Un consejo cualquiera, estable para una misma semilla. */
export function tipAt(index: number): Tip {
  return TIPS[Math.abs(Math.trunc(index)) % TIPS.length];
}

/**
 * El consejo que pide la mesa ahora mismo.
 *
 * Se mira el sitio en el que está el jugador, de lo más concreto a lo más
 * general; si nada encaja, se devuelve uno cualquiera para que el panel nunca
 * quede vacío.
 */
export function tipFor(state: GameState, seat: number): Tip {
  const player = state.players[seat];
  const vivos = state.players.filter((other) => !other.folded);
  const opener = state.aggressor === null ? null : state.players[state.aggressor].position;
  const pick = (trigger: TipTrigger): Tip | null => {
    const list = byTrigger(trigger);
    if (list.length === 0) return null;
    return list[(state.handNumber + seat) % list.length];
  };

  const candidatos: (Tip | null)[] = [];

  if (state.street === "preflop") {
    if (state.raiseCount === 0) {
      const limpers = state.players.filter(
        (other) => !other.folded && !other.isHero && other.bet === BIG_BLIND,
      ).length;
      if (player.position === "SB" && vivos.length === 2) candidatos.push(pick("sb-sin-subir"));
      if (limpers > 0) candidatos.push(pick("limpers"));
    }
    if (state.raiseCount === 1) {
      if (state.currentBet >= 5 * BIG_BLIND) candidatos.push(pick("apertura-grande"));
      if (opener && zoneOf(opener) === "temprana") candidatos.push(pick("vs-temprana"));
    }
    if (state.raiseCount === 2) candidatos.push(pick("vs-3bet"));
    if (state.raiseCount >= 3) candidatos.push(pick("vs-4bet"));
    if (player.cards.length === 2) {
      const hand = handCodeOf(player.cards[0], player.cards[1]);
      if (hand.endsWith("o")) candidatos.push(pick("mano-offsuit"));
    }
  } else if (vivos.length > 2) {
    candidatos.push(pick("multiway"));
  }

  if (vivos.some((other) => other.style === "estación")) candidatos.push(pick("mesa-floja"));
  if (player.stack > 150 * BIG_BLIND) candidatos.push(pick("profundo"));
  if (state.rake) candidatos.push(pick("rastrillo"));

  const elegido = candidatos.find((tip): tip is Tip => tip !== null);
  return elegido ?? tipAt(state.handNumber + seat);
}
