import { describe, expect, it } from "vitest";
import { ALL_LESSONS } from "../curriculum";
import { parseCards } from "./cards";
import { advise } from "./coach";
import { applyAction, BIG_BLIND, createGame, startHand, type GameState } from "./game";
import { classifyLeak, leakInfo, topLeaks, type LeakCounts, type LeakId } from "./leaks";

const LEAK_IDS: LeakId[] = [
  "abrir-fuera-de-rango",
  "limp-fuera-de-plan",
  "pagar-offsuit-contra-temprana",
  "4bet-con-jj-qq",
  "pagar-sin-precio",
  "tirar-con-precio",
  "no-defender-la-ciega",
  "farol-multiway",
  "farol-contra-estacion",
  "pasar-una-mano-hecha",
];

const seatOf = (state: GameState, position: string): number =>
  state.players.findIndex((player) => player.position === position);

const withCards = (state: GameState, seat: number, cards: string): GameState => ({
  ...state,
  players: state.players.map((player) =>
    player.seat === seat ? { ...player, cards: parseCards(cards) } : player,
  ),
});

/** Lleva el turno hasta una silla tirando todo lo que hay delante. */
const upTo = (state: GameState, seat: number): GameState => {
  let next = state;
  while (next.toAct !== seat) next = applyAction(next, { type: "fold" });
  return next;
};

describe("catálogo de fugas", () => {
  it("cada fuga apunta a una lección que existe", () => {
    const hrefs = new Set(ALL_LESSONS.map((entry) => entry.href));
    for (const id of LEAK_IDS) {
      const leak = leakInfo(id);
      expect(hrefs.has(leak.lesson), `${id} → ${leak.lesson}`).toBe(true);
    }
  });

  it("cada fuga dice qué hacer en su lugar", () => {
    for (const id of LEAK_IDS) {
      expect(leakInfo(id).fix.length, id).toBeGreaterThan(20);
    }
  });

  it("ordena por repeticiones y se queda con las que importan", () => {
    const counts: LeakCounts = {
      "pagar-sin-precio": 5,
      "abrir-fuera-de-rango": 9,
      "farol-multiway": 1,
      "tirar-con-precio": 0,
    };
    const top = topLeaks(counts, 2);
    expect(top.map((leak) => leak.id)).toEqual(["abrir-fuera-de-rango", "pagar-sin-precio"]);
    expect(top[0].count).toBe(9);
    expect(topLeaks({}, 3)).toEqual([]);
  });
});

describe("clasificar la jugada", () => {
  it("jugar según el plan no es una fuga", () => {
    let state = startHand(createGame({ size: 9, seed: 8, rake: false }));
    const utg = state.toAct!;
    state = withCards(state, utg, "AsAd");
    const advice = advise(state, utg);
    expect(classifyLeak(state, utg, advice, { type: "raise", to: 3 * BIG_BLIND })).toBeNull();
  });

  it("abrir con una mano fuera del rango", () => {
    let state = startHand(createGame({ size: 9, seed: 8, rake: false }));
    const utg = state.toAct!;
    state = withCards(state, utg, "Kh8d");
    const advice = advise(state, utg);
    const leak = classifyLeak(state, utg, advice, { type: "raise", to: 3 * BIG_BLIND });
    expect(leak?.id).toBe("abrir-fuera-de-rango");
  });

  it("entrar pagando fuera de la ciega pequeña", () => {
    let state = startHand(createGame({ size: 9, seed: 8, rake: false }));
    const utg = state.toAct!;
    state = withCards(state, utg, "As9s");
    const advice = advise(state, utg);
    expect(classifyLeak(state, utg, advice, { type: "call" })?.id).toBe("limp-fuera-de-plan");
  });

  it("pagar offsuit una apertura de posición temprana", () => {
    let state = startHand(createGame({ size: 9, seed: 3, rake: false }));
    const utg = seatOf(state, "UTG");
    const btn = seatOf(state, "BTN");
    state = withCards(state, utg, "AsAd");
    state = withCards(state, btn, "Ah9d");
    state = upTo(state, utg);
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND });
    state = upTo(state, btn);

    const advice = advise(state, btn);
    expect(advice.action.type).toBe("fold");
    expect(classifyLeak(state, btn, advice, { type: "call" })?.id).toBe(
      "pagar-offsuit-contra-temprana",
    );
  });

  it("4-betear con J-J", () => {
    let state = startHand(createGame({ size: 6, seed: 6, rake: false }));
    const co = seatOf(state, "CO");
    const btn = seatOf(state, "BTN");
    state = withCards(state, co, "JsJd");
    state = upTo(state, co);
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND }); // abre CO
    state = upTo(state, btn);
    state = applyAction(state, { type: "raise", to: 9 * BIG_BLIND }); // 3-bet del botón
    state = upTo(state, co);

    const advice = advise(state, co);
    const leak = classifyLeak(state, co, advice, { type: "raise", to: 22 * BIG_BLIND });
    expect(leak?.id).toBe("4bet-con-jj-qq");
  });

  it("tirar la ciega grande cuando el plan decía seguir", () => {
    let state = startHand(createGame({ size: 6, seed: 4, rake: false }));
    const btn = seatOf(state, "BTN");
    const bb = seatOf(state, "BB");
    state = withCards(state, bb, "AsKd");
    state = upTo(state, btn);
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND });
    state = upTo(state, bb);

    const advice = advise(state, bb);
    expect(advice.action.type).not.toBe("fold");
    expect(classifyLeak(state, bb, advice, { type: "fold" })?.id).toBe("no-defender-la-ciega");
  });
});
