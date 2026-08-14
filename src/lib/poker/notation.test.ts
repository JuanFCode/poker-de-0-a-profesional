import { describe, expect, it } from "vitest";
import {
  ALL_HANDS,
  comboCount,
  expandRange,
  GRID,
  handCodeOf,
  rangePercent,
  TOTAL_COMBOS,
} from "./notation";
import { parseCards } from "./cards";

describe("la grid 13x13", () => {
  it("tiene las 169 manos sin repetir", () => {
    expect(ALL_HANDS).toHaveLength(169);
    expect(new Set(ALL_HANDS).size).toBe(169);
  });

  it("coloca las parejas en la diagonal, suited arriba y offsuit abajo", () => {
    expect(GRID[0][0]).toBe("AA");
    expect(GRID[12][12]).toBe("22");
    expect(GRID[0][1]).toBe("AKs");
    expect(GRID[1][0]).toBe("AKo");
  });

  it("las 169 manos suman las 1326 combinaciones de la baraja", () => {
    const total = ALL_HANDS.reduce((sum, hand) => sum + comboCount(hand), 0);
    expect(total).toBe(TOTAL_COMBOS);
  });

  it("cuenta 6 combos por pareja, 4 suited y 12 offsuit", () => {
    expect(comboCount("AA")).toBe(6);
    expect(comboCount("AKs")).toBe(4);
    expect(comboCount("AKo")).toBe(12);
  });
});

describe("cartas concretas a notación", () => {
  it("reconoce pareja, suited y offsuit", () => {
    const [ah, ad, kh, ks] = parseCards("AhAdKhKs");
    expect(handCodeOf(ah, ad)).toBe("AA");
    expect(handCodeOf(ah, kh)).toBe("AKs");
    expect(handCodeOf(ah, ks)).toBe("AKo");
  });

  it("ordena siempre la carta alta primero", () => {
    const [kd, ah] = parseCards("KdAh");
    expect(handCodeOf(kd, ah)).toBe("AKo");
  });
});

describe("expansión de rangos", () => {
  it("expande parejas con +", () => {
    expect([...expandRange("TT+")].sort()).toEqual(["AA", "JJ", "KK", "QQ", "TT"]);
  });

  it("expande suited y offsuit con +", () => {
    expect([...expandRange("ATs+")].sort()).toEqual(["AJs", "AKs", "AQs", "ATs"]);
    expect([...expandRange("KJo+")].sort()).toEqual(["KJo", "KQo"]);
  });

  it("expande tramos de kicker", () => {
    expect([...expandRange("A5s-A2s")].sort()).toEqual(["A2s", "A3s", "A4s", "A5s"]);
  });

  it("expande tramos de conectores del mismo gap", () => {
    expect([...expandRange("76s-54s")].sort()).toEqual(["54s", "65s", "76s"]);
  });

  it("expande tramos de parejas", () => {
    expect([...expandRange("22-55")].sort()).toEqual(["22", "33", "44", "55"]);
  });

  it("acepta listas mezcladas y no duplica", () => {
    const range = expandRange("AA, AKs, AA, TT+");
    expect(range.has("AA")).toBe(true);
    expect(range.has("AKs")).toBe(true);
    expect(range.size).toBe(6); // TT JJ QQ KK AA + AKs
  });

  it("rechaza manos mal escritas", () => {
    expect(() => expandRange("AX")).toThrow();
    expect(() => expandRange("AK")).toThrow(); // falta s u o
  });
});

describe("porcentaje de rango", () => {
  it("AA sola es el 0,45% de las manos", () => {
    expect(rangePercent(["AA"])).toBeCloseTo((6 / 1326) * 100, 5);
  });

  it("todas las manos son el 100%", () => {
    expect(rangePercent(ALL_HANDS)).toBeCloseTo(100, 10);
  });
});
