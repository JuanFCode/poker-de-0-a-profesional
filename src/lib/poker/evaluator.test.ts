import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { CATEGORY, categoryOf, describe as describeHand, evaluate, bestFive } from "./evaluator";

const score = (text: string) => evaluate(parseCards(text));
const category = (text: string) => categoryOf(score(text));

describe("categorías", () => {
  it("clasifica cada mano de las 10 del ranking", () => {
    expect(category("AsKsQsJsTs")).toBe(CATEGORY.STRAIGHT_FLUSH);
    expect(category("9s8s7s6s5s")).toBe(CATEGORY.STRAIGHT_FLUSH);
    expect(category("7s7h7d7c2s")).toBe(CATEGORY.FOUR_OF_A_KIND);
    expect(category("7s7h7d2c2s")).toBe(CATEGORY.FULL_HOUSE);
    expect(category("As9s7s4s2s")).toBe(CATEGORY.FLUSH);
    expect(category("9s8h7d6c5s")).toBe(CATEGORY.STRAIGHT);
    expect(category("7s7h7d9c2s")).toBe(CATEGORY.THREE_OF_A_KIND);
    expect(category("7s7h2d2c9s")).toBe(CATEGORY.TWO_PAIR);
    expect(category("7s7hAd9c2s")).toBe(CATEGORY.PAIR);
    expect(category("As9h7d4c2s")).toBe(CATEGORY.HIGH_CARD);
  });

  it("ordena las categorías de peor a mejor", () => {
    const ordered = [
      "As9h7d4c2s", // carta alta
      "7s7hAd9c2s", // pareja
      "7s7h2d2c9s", // doble pareja
      "7s7h7d9c2s", // trío
      "9s8h7d6c5s", // escalera
      "As9s7s4s2s", // color
      "7s7h7d2c2s", // full
      "7s7h7d7c2s", // póker
      "9s8s7s6s5s", // escalera de color
    ].map(score);
    for (let i = 1; i < ordered.length; i++) expect(ordered[i]).toBeGreaterThan(ordered[i - 1]);
  });
});

describe("desempates", () => {
  it("gana el kicker más alto con la misma pareja", () => {
    expect(score("AhAsKd7c2h")).toBeGreaterThan(score("AhAsQd7c2h"));
  });

  it("compara el tercer kicker cuando los dos primeros empatan", () => {
    expect(score("AhAsKdQc9h")).toBeGreaterThan(score("AhAsKdQc8h"));
  });

  it("la doble pareja más alta gana antes que el kicker", () => {
    expect(score("KhKs2d2c3h")).toBeGreaterThan(score("QhQsJdJc Ah"));
  });

  it("dos manos idénticas en rango empatan aunque cambien los palos", () => {
    expect(score("AhKs9d7c2h")).toBe(score("AsKh9c7d2s"));
  });

  it("el color más alto gana", () => {
    expect(score("AsQs9s5s3s")).toBeGreaterThan(score("KsQs9s5s3s"));
  });
});

describe("la rueda A-2-3-4-5", () => {
  it("es escalera pero la más baja", () => {
    expect(category("Ah2s3d4c5h")).toBe(CATEGORY.STRAIGHT);
    expect(score("Ah2s3d4c5h")).toBeLessThan(score("2h3s4d5c6h"));
  });

  it("no cuenta como escalera al dar la vuelta (Q-K-A-2-3)", () => {
    expect(category("QhKsAd2c3h")).toBe(CATEGORY.HIGH_CARD);
  });

  it("funciona también con color", () => {
    expect(category("Ah2h3h4h5h")).toBe(CATEGORY.STRAIGHT_FLUSH);
    expect(score("Ah2h3h4h5h")).toBeLessThan(score("6h5h4h3h2h"));
  });
});

describe("7 cartas", () => {
  it("elige las 5 mejores del total", () => {
    // Board con color: la mano usa el color, no la pareja.
    expect(category("AhKd 2h5h9hQh3c")).toBe(CATEGORY.FLUSH);
  });

  it("prefiere el full al trío cuando el board empareja", () => {
    // AA en mano + as en el board = trío, y la pareja de doses lo convierte en full.
    expect(category("AhAd As2c2d9h3s")).toBe(CATEGORY.FULL_HOUSE);
  });

  it("con dos parejas altas y board sin ligar se queda en doble pareja", () => {
    expect(category("AhAd KsKh2c9d3s")).toBe(CATEGORY.TWO_PAIR);
  });

  it("detecta la escalera repartida entre mano y board", () => {
    expect(category("9h8d 7s6c5h2d2s")).toBe(CATEGORY.STRAIGHT);
  });

  it("bestFive devuelve exactamente las cartas que puntúan", () => {
    const cards = parseCards("AhKd2h5h9hQh3c");
    const five = bestFive(cards);
    expect(five).toHaveLength(5);
    expect(evaluate(five)).toBe(evaluate(cards));
  });
});

describe("nombres", () => {
  it("distingue la escalera real", () => {
    expect(describeHand(score("AsKsQsJsTs"))).toBe("Escalera real");
    expect(describeHand(score("9s8s7s6s5s"))).toBe("Escalera de color");
    expect(describeHand(score("7s7h2d2c9s"))).toBe("Doble pareja");
  });
});
