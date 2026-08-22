import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { botMove } from "./bot";
import { advise, bluffRead, matchesAdvice, spotRange } from "./coach";
import { classifyLeak } from "./leaks";
import { createRandom } from "./random";
import { tipFor } from "./tips";
import {
  applyAction,
  BIG_BLIND,
  createGame,
  legalMoves,
  startHand,
  type BotStyle,
  type GameAction,
  type GameState,
} from "./game";
import { breakevenBluff } from "./odds";

const seatOf = (state: GameState, position: string): number =>
  state.players.findIndex((player) => player.position === position);

/** Mano en el flop, montada a mano: cartas, board y bote controlados. */
function onFlop(options: {
  board: string;
  hero: string;
  rivals: number;
  style?: BotStyle;
  pot?: number;
}): { state: GameState; seat: number } {
  const size = 6;
  const base = startHand(createGame({ size, seed: 21, rake: false }));
  const seat = base.heroSeat;
  const vivos = new Set<number>([seat]);
  for (let i = 1; i <= options.rivals; i++) vivos.add((seat + i) % size);

  const state: GameState = {
    ...base,
    street: "flop",
    board: parseCards(options.board),
    pot: options.pot ?? 10 * BIG_BLIND,
    currentBet: 0,
    lastRaise: BIG_BLIND,
    raiseCount: 0,
    aggressor: null,
    toAct: seat,
    players: base.players.map((player) => ({
      ...player,
      cards: player.seat === seat ? parseCards(options.hero) : player.cards,
      style: player.seat === seat ? player.style : (options.style ?? "sólido"),
      folded: !vivos.has(player.seat),
      bet: 0,
      acted: false,
    })),
  };
  return { state, seat };
}

describe("el entrenador antes de decidir", () => {
  it("preflop cita el rango de la silla", () => {
    let state = startHand(createGame({ size: 9, seed: 8, rake: false }));
    const utg = state.toAct!;
    state = {
      ...state,
      players: state.players.map((player) =>
        player.seat === utg ? { ...player, cards: parseCards("AsAd") } : player,
      ),
    };
    const advice = advise(state, utg);
    expect(advice.headline).toContain("Sube");
    expect(advice.numbers.some((entry) => entry.label.includes("Rango"))).toBe(true);
    expect(matchesAdvice(advice, { type: "raise", to: 3 * BIG_BLIND })).toBe(true);
    expect(matchesAdvice(advice, { type: "fold" })).toBe(false);
  });

  it("postflop deja la equity en el consejo para poder revisarlo después", () => {
    const { state, seat } = onFlop({ board: "AsKd7c", hero: "AhAc", rivals: 1 });
    const advice = advise(state, seat);
    expect(advice.equity).toBeGreaterThan(0.8);
  });
});

describe("cuándo mentir", () => {
  it("sin subida delante no hay nada que farolear", () => {
    const state = startHand(createGame({ size: 6, seed: 9, rake: false }));
    const read = bluffRead(state, state.toAct!);
    expect(read.verdict).toBe("no");
    expect(read.headline).toContain("Todavía");
  });

  it("en bote multiway no se farolea", () => {
    const { state, seat } = onFlop({ board: "AsKd7c", hero: "5h4d", rivals: 2 });
    const read = bluffRead(state, seat);
    expect(read.verdict).toBe("no");
    expect(read.headline).toContain("Multiway");
  });

  it("no se farolea a quien paga de más", () => {
    const { state, seat } = onFlop({
      board: "AsKd7c",
      hero: "5h4d",
      rivals: 1,
      style: "estación",
    });
    const read = bluffRead(state, seat);
    expect(read.verdict).toBe("no");
    expect(read.reads.join(" ")).toContain("paga de más");
  });

  it("con la mejor mano manda el valor, no el farol", () => {
    const { state, seat } = onFlop({ board: "AsKd7c", hero: "AhAc", rivals: 1 });
    expect(bluffRead(state, seat).verdict).toBe("valor");
  });

  it("cuenta el fold equity que necesita la apuesta de dos tercios", () => {
    const pot = 10 * BIG_BLIND;
    const { state, seat } = onFlop({ board: "AsKd7c", hero: "5h4d", rivals: 1, pot });
    const read = bluffRead(state, seat);
    const esperado = breakevenBluff(pot, Math.round(0.66 * pot));
    expect(read.numbers[0].value).toBe(`${Math.round(esperado * 100)}%`);
  });

  it("reconoce el as del color como bloqueo", () => {
    const { state, seat } = onFlop({ board: "Ks7s2s", hero: "AsQd", rivals: 1 });
    const read = bluffRead(state, seat);
    expect(read.blockers.join(" ")).toContain("as de picas");
  });

  it("preflop elige los 3-bets de farol por los blockers", () => {
    let state = startHand(createGame({ size: 6, seed: 4, rake: false }));
    const co = seatOf(state, "CO");
    const btn = seatOf(state, "BTN");
    state = {
      ...state,
      // Mesa de rivales sólidos: contra una estación el 3-bet de farol no existe.
      players: state.players.map((player) => ({
        ...player,
        style: player.isHero ? player.style : "sólido",
        cards: player.seat === btn ? parseCards("Ah5h") : player.cards,
      })),
    };
    while (state.toAct !== co) state = applyAction(state, { type: "fold" });
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND });

    const read = bluffRead(state, btn);
    expect(read.verdict).toBe("farol");
    expect(read.blockers.join(" ")).toContain("as");
  });
});

describe("una sesión entera con el entrenador puesto", () => {
  it("cada decisión del jugador tiene plan, tabla, farol, consejo y clasificación", () => {
    const random = createRandom(99);
    let state = createGame({ size: 6, seed: 404, rake: true });
    let decisiones = 0;
    let conRango = 0;

    for (let hand = 0; hand < 20; hand++) {
      state = startHand(state);
      let guard = 0;
      while (state.result === null && guard++ < 200) {
        const seat = state.toAct!;
        if (seat === state.heroSeat) {
          // Lo mismo que pinta la interfaz en cada pestaña.
          const advice = advise(state, seat);
          const read = bluffRead(state, seat);
          const grid = spotRange(state, seat);
          const tip = tipFor(state, seat);
          expect(advice.headline.length).toBeGreaterThan(0);
          expect(["farol", "valor", "no"]).toContain(read.verdict);
          expect(tip.text.length).toBeGreaterThan(20);
          if (grid) {
            conRango += 1;
            expect(grid.actionFor("AA")).toBeDefined();
            expect(grid.legend.length).toBeGreaterThan(1);
          }
          // Jugar al revés de lo que dice el plan siempre tiene que ser clasificable.
          const contrario: GameAction =
            advice.action.type === "fold" ? { type: "call" } : { type: "fold" };
          const legal = legalMoves(state, seat);
          if ((contrario.type === "call" && legal.canCall) || contrario.type === "fold") {
            expect(() => classifyLeak(state, seat, advice, contrario)).not.toThrow();
          }
          decisiones += 1;
        }
        state = applyAction(state, botMove(state, seat, random).action);
      }
      expect(guard).toBeLessThan(200);
    }

    expect(decisiones).toBeGreaterThan(20);
    expect(conRango).toBeGreaterThan(5);
  });
});
