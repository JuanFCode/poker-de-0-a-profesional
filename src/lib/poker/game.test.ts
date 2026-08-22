import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import {
  applyAction,
  BIG_BLIND,
  buildPots,
  createGame,
  formatBB,
  legalMoves,
  positionOf,
  RAKE,
  rakeFor,
  SMALL_BLIND,
  startHand,
  totalPot,
  type GameState,
} from "./game";
import { botMove } from "./bot";
import { createRandom } from "./random";

const deal = (size: 9 | 6 | 2 = 6, seed = 42, rake = false) =>
  startHand(createGame({ size, seed, rake }));

/** Fichas que hay en la mesa: stacks + lo apostado + lo recogido. */
const chipsOnTable = (state: GameState): number =>
  state.players.reduce((sum, player) => sum + player.stack + player.bet, 0) + state.pot;

describe("reparto", () => {
  it("da dos cartas a cada uno y cobra las ciegas", () => {
    const state = deal(6);
    expect(state.players.every((player) => player.cards.length === 2)).toBe(true);
    expect(state.deck.length).toBe(52 - 2 * 6);

    const sb = state.players.find((player) => player.position === "SB")!;
    const bb = state.players.find((player) => player.position === "BB")!;
    expect(sb.bet).toBe(SMALL_BLIND);
    expect(bb.bet).toBe(BIG_BLIND);
    expect(state.currentBet).toBe(BIG_BLIND);
    expect(totalPot(state)).toBe(SMALL_BLIND + BIG_BLIND);
  });

  it("empieza a hablar el primero de la mesa, no el botón", () => {
    const state = deal(6);
    expect(state.players[state.toAct!].position).toBe("LJ");
  });

  it("en heads-up el botón pone la ciega pequeña y habla primero", () => {
    const state = deal(2);
    const button = state.players[state.buttonSeat];
    expect(button.position).toBe("BTN");
    expect(button.bet).toBe(SMALL_BLIND);
    expect(state.toAct).toBe(state.buttonSeat);
  });

  it("reparte las posiciones alrededor del botón", () => {
    expect(positionOf(0, 0, 6)).toBe("BTN");
    expect(positionOf(1, 0, 6)).toBe("SB");
    expect(positionOf(2, 0, 6)).toBe("BB");
    expect(positionOf(3, 0, 6)).toBe("LJ");
  });
});

describe("ronda de apuestas", () => {
  it("la ciega grande tiene opción cuando todos igualan", () => {
    let state = deal(6);
    // Todos los de delante pagan la ciega grande: LJ, HJ, CO, BTN y la pequeña.
    for (let i = 0; i < 5; i++) state = applyAction(state, { type: "call" });
    const bb = state.players.find((player) => player.position === "BB")!;
    expect(state.toAct).toBe(bb.seat);
    expect(legalMoves(state, bb.seat).canCheck).toBe(true);

    state = applyAction(state, { type: "check" });
    expect(state.street).toBe("flop");
    expect(state.board.length).toBe(3);
  });

  it("una subida obliga a volver a hablar a quien ya había pagado", () => {
    let state = deal(6);
    state = applyAction(state, { type: "call" });
    const caller = state.players.find((player) => player.position === "LJ")!;
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND });
    expect(state.players[caller.seat].acted).toBe(false);
    expect(state.currentBet).toBe(3 * BIG_BLIND);
  });

  it("la subida mínima es la anterior otra vez", () => {
    let state = deal(6);
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND });
    const next = legalMoves(state, state.toAct!);
    expect(next.minRaiseTo).toBe(5 * BIG_BLIND);
  });

  it("si todos se tiran, la ciega grande se lleva el bote sin showdown", () => {
    let state = deal(6);
    const bb = state.players.find((player) => player.position === "BB")!;
    const before = state.players[bb.seat].stack;
    while (state.result === null) state = applyAction(state, { type: "fold" });

    expect(state.result.showdown).toBe(false);
    expect(state.players[bb.seat].stack).toBe(before + SMALL_BLIND + BIG_BLIND);
  });
});

describe("showdown", () => {
  it("gana la mejor mano de cinco cartas", () => {
    let state = deal(2, 7);
    const [hero] = state.players;
    state = {
      ...state,
      players: state.players.map((player) =>
        player.seat === hero.seat
          ? { ...player, cards: parseCards("AsAd") }
          : { ...player, cards: parseCards("7c2h") },
      ),
      deck: parseCards("KsQd9h4c3s"),
    };

    state = applyAction(state, { type: "call" });
    state = applyAction(state, { type: "check" });
    while (state.result === null) state = applyAction(state, { type: "check" });

    expect(state.result.showdown).toBe(true);
    expect(state.result.ranked[0].seat).toBe(hero.seat);
    // Se lleva la ciega grande del rival y recupera lo suyo.
    expect(state.players[hero.seat].stack).toBe(state.startingStack + BIG_BLIND);
  });

  it("reparte el bote cuando el board da la misma mano a los dos", () => {
    let state = deal(2, 11);
    state = {
      ...state,
      players: state.players.map((player) => ({
        ...player,
        cards: player.seat === 0 ? parseCards("2c3d") : parseCards("2h3s"),
      })),
      deck: parseCards("AsAdKcKdQh"),
    };
    const stacks = state.players.map((player) => player.stack + player.bet);

    state = applyAction(state, { type: "call" });
    state = applyAction(state, { type: "check" });
    while (state.result === null) state = applyAction(state, { type: "check" });

    expect(state.result.payouts.length).toBe(2);
    expect(state.players.map((player) => player.stack)).toEqual(stacks);
  });
});

describe("botes laterales", () => {
  it("monta un bote por cada nivel de fichas comprometidas", () => {
    const state = deal(6);
    const committed = [1000, 3000, 3000, 500, 0, 0];
    const players = state.players.map((player) => ({
      ...player,
      committed: committed[player.seat],
      folded: player.seat === 3 || committed[player.seat] === 0,
    }));

    const pots = buildPots(players);
    // Primer nivel (500): pone todo el mundo, incluido el que luego se tiró.
    expect(pots[0]).toEqual({ amount: 2000, eligible: [0, 1, 2] });
    expect(pots.reduce((sum, pot) => sum + pot.amount, 0)).toBe(7500);
    // El último nivel solo lo pueden ganar los dos que pusieron 3000.
    expect(pots[pots.length - 1].eligible).toEqual([1, 2]);
  });
});

describe("rastrillo", () => {
  it("no cobra si la mano se decide antes del flop", () => {
    expect(rakeFor(50 * BIG_BLIND, false)).toBe(0);
  });

  it("cobra el 10% del bote hasta el tope de 4bb", () => {
    expect(rakeFor(20 * BIG_BLIND, true)).toBe(2 * BIG_BLIND);
    expect(rakeFor(100 * BIG_BLIND, true)).toBe(RAKE.capBB * BIG_BLIND);
  });

  it("la casa solo cobra cuando se ve el flop", () => {
    // Heads-up: el botón sube, la ciega grande se tira. No hay flop.
    let sinFlop = startHand(createGame({ size: 2, seed: 5, rake: true }));
    sinFlop = applyAction(sinFlop, { type: "raise", to: 3 * BIG_BLIND });
    sinFlop = applyAction(sinFlop, { type: "fold" });
    expect(sinFlop.result?.rake).toBe(0);

    // Ahora se paga y se pasa hasta el showdown: el bote sí paga rastrillo.
    let conFlop = startHand(createGame({ size: 2, seed: 5, rake: true }));
    conFlop = applyAction(conFlop, { type: "call" });
    conFlop = applyAction(conFlop, { type: "check" });
    let guard = 0;
    while (conFlop.result === null && guard++ < 40) {
      conFlop = applyAction(conFlop, { type: "check" });
    }
    expect(conFlop.result!.rake).toBe(rakeFor(conFlop.result!.pot, true));
    expect(conFlop.result!.rake).toBeGreaterThan(0);
  });

  it("lo repartido más el rastrillo es todo el bote", () => {
    const random = createRandom(7);
    let state = createGame({ size: 6, seed: 31, rake: true });
    for (let hand = 0; hand < 25; hand++) {
      state = startHand(state);
      let guard = 0;
      while (state.result === null && guard++ < 200) {
        state = applyAction(state, botMove(state, state.toAct!, random).action);
      }
      const result = state.result!;
      const repartido = result.payouts.reduce((sum, share) => sum + share.amount, 0);
      expect(repartido + result.rake).toBe(result.pot);
    }
  });

  it("apagado, la casa no se lleva nada", () => {
    const random = createRandom(3);
    let state = createGame({ size: 6, seed: 77, rake: false });
    for (let hand = 0; hand < 10; hand++) {
      state = startHand(state);
      let guard = 0;
      while (state.result === null && guard++ < 200) {
        state = applyAction(state, botMove(state, state.toAct!, random).action);
      }
      expect(state.result!.rake).toBe(0);
    }
  });
});

describe("invariantes jugando manos enteras", () => {
  it("las fichas de la mesa no se crean ni se destruyen", () => {
    const random = createRandom(2024);
    // Sin rastrillo: con la casa cobrando, las fichas sí salen de la mesa.
    let state = createGame({ size: 6, seed: 99, rake: false });

    for (let hand = 0; hand < 60; hand++) {
      state = startHand(state);
      // Se mide mano a mano: entre manos la mesa recompra a quien se arruina.
      const total = chipsOnTable(state);
      let guard = 0;
      while (state.result === null && guard++ < 200) {
        const seat = state.toAct!;
        state = applyAction(state, botMove(state, seat, random).action);
      }
      expect(guard).toBeLessThan(200);
      expect(chipsOnTable(state)).toBe(total);
    }
  });

  it("los bots nunca devuelven una acción ilegal", () => {
    const random = createRandom(7);
    let state = createGame({ size: 9, seed: 5 });

    for (let hand = 0; hand < 25; hand++) {
      state = startHand(state);
      while (state.result === null) {
        const seat = state.toAct!;
        const legal = legalMoves(state, seat);
        const move = botMove(state, seat, random).action;
        if (move.type === "check") expect(legal.canCheck).toBe(true);
        if (move.type === "call") expect(legal.canCall).toBe(true);
        if (move.type === "raise") {
          expect(legal.canRaise).toBe(true);
          expect(move.to).toBeGreaterThanOrEqual(legal.minRaiseTo);
          expect(move.to).toBeLessThanOrEqual(legal.maxRaiseTo);
        }
        state = applyAction(state, move);
      }
      expect(state.players.filter((player) => !player.folded).length).toBeGreaterThan(0);
    }
  });
});

describe("formato", () => {
  it("cuenta en ciegas grandes", () => {
    expect(formatBB(300)).toBe("3bb");
    expect(formatBB(250)).toBe("2,5bb");
  });
});
