import { describe, expect, it } from "vitest";
import { applyReview, BOX_DELAYS, deckStats, MAX_BOX, newCard, nextCardId, review } from "./srs";

const NOW = 1_000_000;

describe("cajas de Leitner", () => {
  it("acertar sube de caja y aleja el repaso", () => {
    const card = review(newCard("a"), true, NOW);
    expect(card.box).toBe(1);
    expect(card.due).toBe(NOW + BOX_DELAYS[1]);
    expect(card.correct).toBe(1);
  });

  it("fallar devuelve a la primera caja", () => {
    let card = newCard("a");
    for (let i = 0; i < 3; i++) card = review(card, true, NOW);
    expect(card.box).toBe(3);
    card = review(card, false, NOW);
    expect(card.box).toBe(0);
    expect(card.due).toBe(NOW + BOX_DELAYS[0]);
  });

  it("no pasa de la última caja", () => {
    let card = newCard("a");
    for (let i = 0; i < 20; i++) card = review(card, true, NOW);
    expect(card.box).toBe(MAX_BOX);
    expect(card.seen).toBe(20);
  });
});

describe("selección de la siguiente pregunta", () => {
  const ids = ["a", "b", "c"];

  it("empieza por las que no has visto nunca", () => {
    const deck = applyReview({}, "a", true, NOW);
    expect(nextCardId(deck, ids, NOW)).toBe("b");
  });

  it("luego coge la vencida más atrasada", () => {
    let deck = applyReview({}, "a", false, NOW - 10 * BOX_DELAYS[0]);
    deck = applyReview(deck, "b", false, NOW - 2 * BOX_DELAYS[0]);
    deck = applyReview(deck, "c", true, NOW);
    expect(nextCardId(deck, ids, NOW)).toBe("a");
  });

  it("si no hay nada vencido devuelve la más próxima", () => {
    let deck = applyReview({}, "a", true, NOW);
    deck = applyReview(deck, "b", false, NOW);
    deck = applyReview(deck, "c", true, NOW);
    expect(nextCardId(deck, ids, NOW)).toBe("b"); // la fallada vuelve antes
  });

  it("devuelve null sin preguntas", () => {
    expect(nextCardId({}, [], NOW)).toBeNull();
  });
});

describe("estadísticas", () => {
  it("cuenta estudiadas, dominadas, pendientes y precisión", () => {
    const ids = ["a", "b", "c"];
    let deck = applyReview({}, "a", true, NOW);
    deck = applyReview(deck, "b", false, NOW);

    const stats = deckStats(deck, ids, NOW + BOX_DELAYS[0] + 1);
    expect(stats.total).toBe(3);
    expect(stats.studied).toBe(2);
    expect(stats.mastered).toBe(0);
    expect(stats.dueNow).toBe(2); // la fallada ya vence + la que no has visto
    expect(stats.accuracy).toBeCloseTo(0.5, 5);
  });

  it("marca como dominada la que llega a la última caja", () => {
    let deck = {};
    for (let i = 0; i <= MAX_BOX; i++) deck = applyReview(deck, "a", true, NOW);
    expect(deckStats(deck, ["a"], NOW).mastered).toBe(1);
  });
});
