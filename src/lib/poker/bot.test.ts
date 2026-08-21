import { describe, expect, it } from "vitest";
import { botMove, preflopPlan } from "./bot";
import { advise, matchesAdvice } from "./coach";
import { parseCards } from "./cards";
import { applyAction, BIG_BLIND, createGame, startHand, type GameState } from "./game";
import { createRandom } from "./random";

const random = createRandom(3);

/** Mano repartida con las cartas puestas a mano, para probar decisiones concretas. */
function withCards(state: GameState, cards: Record<number, string>, deck?: string): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      cards[player.seat] ? { ...player, cards: parseCards(cards[player.seat]) } : player,
    ),
    deck: deck ? parseCards(deck) : state.deck,
  };
}

const seatOf = (state: GameState, position: string): number =>
  state.players.findIndex((player) => player.position === position);

describe("plan preflop", () => {
  it("abre con la mano más fuerte desde la peor silla", () => {
    let state = startHand(createGame({ size: 9, seed: 1 }));
    const utg = seatOf(state, "UTG");
    state = withCards(state, { [utg]: "AsAd" });
    expect(preflopPlan(state, utg).action).toBe("raise");
  });

  it("tira la basura desde temprana aunque sea vistosa", () => {
    let state = startHand(createGame({ size: 9, seed: 1 }));
    const utg = seatOf(state, "UTG");
    state = withCards(state, { [utg]: "KsJd" });
    expect(preflopPlan(state, utg).action).toBe("fold");
  });

  it("resube desde la ciega grande contra la apertura del botón", () => {
    let state = startHand(createGame({ size: 6, seed: 4 }));
    const btn = seatOf(state, "BTN");
    const bb = seatOf(state, "BB");
    state = withCards(state, { [bb]: "AsAd" });
    while (state.toAct !== btn) state = applyAction(state, { type: "fold" });
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND });
    while (state.toAct !== bb) state = applyAction(state, { type: "fold" });

    const plan = preflopPlan(state, bb);
    expect(plan.action).toBe("3bet");
    expect(plan.spot).toContain("BTN");
  });

  it("contra un 4-bet solo sigue el rango de premio", () => {
    let state = startHand(createGame({ size: 6, seed: 6 }));
    const co = seatOf(state, "CO");
    const btn = seatOf(state, "BTN");
    state = withCards(state, { [btn]: "9s9d" });
    while (state.toAct !== co) state = applyAction(state, { type: "fold" });
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND }); // open
    state = applyAction(state, { type: "raise", to: 9 * BIG_BLIND }); // 3-bet del botón
    while (state.toAct !== co) state = applyAction(state, { type: "fold" });
    state = applyAction(state, { type: "raise", to: 20 * BIG_BLIND }); // 4-bet

    expect(state.toAct).toBe(btn);
    expect(preflopPlan(state, btn).action).toBe("fold");
  });
});

describe("decisiones postflop", () => {
  /** Heads-up hasta el flop con cartas puestas: hero con la escalera máxima. */
  function toFlop(heroCards: string, rivalCards: string, board: string) {
    let state = startHand(createGame({ size: 2, seed: 8 }));
    state = withCards(state, { 0: heroCards, 1: rivalCards }, `${board}2c2d`);
    state = applyAction(state, { type: "call" });
    state = applyAction(state, { type: "check" });
    return state;
  }

  it("apuesta con la mejor mano posible", () => {
    const state = toFlop("AsKs", "7c2h", "QsJsTh");
    const move = botMove(state, state.toAct!, random);
    expect(move.action.type).toBe("raise");
  });

  it("se tira sin equity cuando el precio no sale", () => {
    let state = toFlop("7c2h", "AsKs", "QsJsTh");
    // Habla primero la ciega grande: que apueste dos tercios del bote.
    state = applyAction(state, { type: "raise", to: 150 });
    expect(state.players[state.toAct!].isHero).toBe(true);
    const move = botMove(state, state.toAct!, random);
    expect(move.action.type).toBe("fold");
  });
});

describe("entrenador", () => {
  it("preflop explica de qué rango sale la decisión", () => {
    let state = startHand(createGame({ size: 6, seed: 2 }));
    const hero = state.heroSeat;
    state = withCards(state, { [hero]: "AsAd" });
    while (state.toAct !== hero) state = applyAction(state, { type: "fold" });

    const advice = advise(state, hero);
    expect(advice.action.type).toBe("raise");
    expect(advice.source).toContain(state.players[hero].position);
    expect(advice.numbers.length).toBeGreaterThan(0);
  });

  it("postflop enseña la equity y el precio del bote", () => {
    let state = startHand(createGame({ size: 2, seed: 12 }));
    state = withCards(state, { 0: "AsAd", 1: "7c2h" }, "Ac5d9h2s3c");
    state = applyAction(state, { type: "call" });
    state = applyAction(state, { type: "check" });
    if (!state.players[state.toAct!].isHero) state = applyAction(state, { type: "check" });

    const advice = advise(state, state.heroSeat);
    expect(advice.numbers.some((entry) => entry.label === "Tu equity")).toBe(true);
    expect(advice.action.type).toBe("raise");
  });

  it("compara lo jugado con el plan", () => {
    let state = startHand(createGame({ size: 6, seed: 3 }));
    const hero = state.heroSeat;
    state = withCards(state, { [hero]: "AsAd" });
    while (state.toAct !== hero) state = applyAction(state, { type: "fold" });

    const advice = advise(state, hero);
    expect(matchesAdvice(advice, { type: "raise", to: 300 })).toBe(true);
    expect(matchesAdvice(advice, { type: "fold" })).toBe(false);
  });
});
