import { describe, expect, it } from "vitest";
import { ALL_LESSONS } from "../curriculum";
import { applyAction, BIG_BLIND, createGame, startHand, type GameState } from "./game";
import { TIPS, tipAt, tipFor } from "./tips";

const seatOf = (state: GameState, position: string): number =>
  state.players.findIndex((player) => player.position === position);

describe("consejos de mesa", () => {
  it("no hay dos consejos con el mismo id", () => {
    expect(new Set(TIPS.map((tip) => tip.id)).size).toBe(TIPS.length);
  });

  it("cada consejo que enlaza una lección enlaza una que existe", () => {
    const hrefs = new Set(ALL_LESSONS.map((entry) => entry.href));
    for (const tip of TIPS) {
      if (tip.lesson) expect(hrefs.has(tip.lesson), `${tip.id} → ${tip.lesson}`).toBe(true);
    }
  });

  it("tipAt siempre devuelve algo, con cualquier número", () => {
    expect(tipAt(0).id).toBe(TIPS[0].id);
    expect(tipAt(-7)).toBeDefined();
    expect(tipAt(TIPS.length * 3 + 2).id).toBe(TIPS[2].id);
  });

  it("en la ciega pequeña sin subir habla de repartir, limpear o subir a 4bb", () => {
    let state = startHand(createGame({ size: 6, seed: 4, rake: true }));
    const sb = seatOf(state, "SB");
    while (state.toAct !== sb) state = applyAction(state, { type: "fold" });
    expect(tipFor(state, sb).trigger).toBe("sb-sin-subir");
  });

  it("contra un 3-bet avisa de la dominación y de no 4-betear J-J", () => {
    let state = startHand(createGame({ size: 6, seed: 6, rake: true }));
    const co = seatOf(state, "CO");
    const btn = seatOf(state, "BTN");
    while (state.toAct !== co) state = applyAction(state, { type: "fold" });
    state = applyAction(state, { type: "raise", to: 3 * BIG_BLIND });
    while (state.toAct !== btn) state = applyAction(state, { type: "fold" });
    state = applyAction(state, { type: "raise", to: 9 * BIG_BLIND });
    while (state.toAct !== co) state = applyAction(state, { type: "fold" });

    expect(tipFor(state, co).trigger).toBe("vs-3bet");
  });
});
