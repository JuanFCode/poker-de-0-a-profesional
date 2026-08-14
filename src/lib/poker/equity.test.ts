import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { calculateEquity, handCombos } from "./equity";
import { expandRange } from "./notation";

describe("combos de una mano", () => {
  it("genera 6, 4 y 12 combinaciones", () => {
    expect(handCombos("AA")).toHaveLength(6);
    expect(handCombos("AKs")).toHaveLength(4);
    expect(handCombos("AKo")).toHaveLength(12);
  });

  it("suited comparte palo y offsuit no", () => {
    for (const [a, b] of handCombos("AKs")) expect(a & 3).toBe(b & 3);
    for (const [a, b] of handCombos("AKo")) expect(a & 3).not.toBe(b & 3);
  });
});

describe("enumeración exacta", () => {
  it("con el board completo declara un ganador claro", () => {
    const result = calculateEquity({
      hero: parseCards("AhAd"),
      opponents: [{ kind: "cards", cards: parseCards("KhKd") }],
      board: parseCards("2c7s9hJd3s"),
    });
    expect(result.exact).toBe(true);
    expect(result.hero.equity).toBe(1);
    expect(result.opponents[0].equity).toBe(0);
  });

  it("reparte el bote cuando el board manda", () => {
    const result = calculateEquity({
      hero: parseCards("2h3d"),
      opponents: [{ kind: "cards", cards: parseCards("2s3c") }],
      board: parseCards("AcKsQhJdTs"),
    });
    expect(result.hero.equity).toBeCloseTo(0.5, 10);
    expect(result.hero.tie).toBe(1);
  });

  it("enumera el river: AA vs proyecto de color con 9 outs", () => {
    const result = calculateEquity({
      hero: parseCards("AhAd"),
      opponents: [{ kind: "cards", cards: parseCards("KsQs") }],
      board: parseCards("2s7s9c4d"),
    });
    expect(result.exact).toBe(true);
    // Solo el color gana: emparejar K o Q sigue perdiendo contra AA.
    // Quedan 9 picas de 44 cartas.
    expect(result.opponents[0].equity).toBeCloseTo(9 / 44, 5);
  });
});

describe("Monte Carlo", () => {
  it("AA contra KK preflop ronda el 81%", () => {
    const result = calculateEquity({
      hero: parseCards("AhAd"),
      opponents: [{ kind: "cards", cards: parseCards("KhKd") }],
      iterations: 30_000,
      seed: 7,
    });
    expect(result.exact).toBe(false);
    expect(result.hero.equity).toBeGreaterThan(0.79);
    expect(result.hero.equity).toBeLessThan(0.84);
  });

  it("AKs contra QQ es casi una moneda al aire", () => {
    const result = calculateEquity({
      hero: parseCards("AsKs"),
      opponents: [{ kind: "cards", cards: parseCards("QhQd") }],
      iterations: 30_000,
      seed: 11,
    });
    expect(result.hero.equity).toBeGreaterThan(0.44);
    expect(result.hero.equity).toBeLessThan(0.51);
  });

  it("las equities de todos los jugadores suman 1", () => {
    const result = calculateEquity({
      hero: parseCards("AhKh"),
      opponents: [
        { kind: "cards", cards: parseCards("7c7d") },
        { kind: "random" },
      ],
      iterations: 8_000,
      seed: 3,
    });
    const total = result.hero.equity + result.opponents.reduce((sum, o) => sum + o.equity, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("contra un rango fuerte tienes menos equity que contra uno cualquiera", () => {
    const hero = parseCards("JhTh");
    const contraFuerte = calculateEquity({
      hero,
      opponents: [{ kind: "range", hands: [...expandRange("QQ+, AKs, AKo")] }],
      iterations: 15_000,
      seed: 5,
    });
    const contraCualquiera = calculateEquity({
      hero,
      opponents: [{ kind: "random" }],
      iterations: 15_000,
      seed: 5,
    });
    expect(contraFuerte.hero.equity).toBeLessThan(contraCualquiera.hero.equity);
    expect(contraFuerte.hero.equity).toBeGreaterThan(0.25);
  });

  it("la misma semilla da el mismo resultado", () => {
    const input = {
      hero: parseCards("AhKd"),
      opponents: [{ kind: "random" as const }],
      iterations: 2_000,
      seed: 42,
    };
    expect(calculateEquity(input).hero.equity).toBe(calculateEquity(input).hero.equity);
  });
});
