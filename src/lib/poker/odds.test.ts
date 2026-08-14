import { describe, expect, it } from "vitest";
import {
  breakevenBluff,
  callEV,
  equityFromOuts,
  impliedOddsNeeded,
  minimumDefenceFrequency,
  potOddsRatio,
  requiredEquity,
  ruleOf2and4,
} from "./odds";

describe("pot odds", () => {
  it("igualar 50 con 150 ya en el bote pide el 25%", () => {
    // Bote de 100 + apuesta de 50 del rival = 150. Pagas 50 para llevarte 200.
    expect(requiredEquity(150, 50)).toBeCloseTo(0.25, 5);
    expect(potOddsRatio(150, 50)).toBeCloseTo(3, 5);
  });

  it("una apuesta del tamaño del bote pide el 33%", () => {
    // Bote de 100, el rival apuesta 100 -> hay 200 y pagas 100.
    expect(requiredEquity(200, 100)).toBeCloseTo(1 / 3, 5);
  });

  it("media apuesta de bote pide el 25% y dos veces el bote el 40%", () => {
    expect(requiredEquity(150, 50)).toBeCloseTo(0.25, 5);
    expect(requiredEquity(300, 200)).toBeCloseTo(0.4, 5);
  });
});

describe("outs", () => {
  it("proyecto de color con 9 outs: 35% desde el flop, 19,6% desde el turn", () => {
    expect(equityFromOuts(9, "flop")).toBeCloseTo(0.35, 2);
    expect(equityFromOuts(9, "turn")).toBeCloseTo(0.1957, 3);
  });

  it("escalera abierta con 8 outs: 31,5% desde el flop", () => {
    expect(equityFromOuts(8, "flop")).toBeCloseTo(0.315, 2);
  });

  it("gutshot con 4 outs: 8,7% desde el turn", () => {
    expect(equityFromOuts(4, "turn")).toBeCloseTo(0.087, 3);
  });

  it("la regla del 2 y el 4 se queda cerca del valor real", () => {
    expect(ruleOf2and4(9, "flop")).toBeCloseTo(0.36, 5);
    expect(Math.abs(ruleOf2and4(9, "flop") - equityFromOuts(9, "flop"))).toBeLessThan(0.02);
    expect(Math.abs(ruleOf2and4(4, "turn") - equityFromOuts(4, "turn"))).toBeLessThan(0.01);
  });

  it("no pasa del 100% aunque le pongas outs imposibles", () => {
    expect(equityFromOuts(99, "flop")).toBe(1);
    expect(ruleOf2and4(99, "turn")).toBe(1);
  });
});

describe("EV de igualar", () => {
  it("es positivo cuando tienes más equity que la que pide el precio", () => {
    // 35% de equity pagando 50 en un bote de 150: 0,35*150 - 0,65*50 = +20.
    expect(callEV(0.35, 150, 50)).toBeCloseTo(20, 5);
  });

  it("es negativo cuando te falta equity", () => {
    expect(callEV(0.1, 150, 50)).toBeLessThan(0);
  });

  it("es cero justo en el punto de equilibrio", () => {
    const pot = 150;
    const call = 50;
    expect(callEV(requiredEquity(pot, call), pot, call)).toBeCloseTo(0, 10);
  });
});

describe("frecuencias", () => {
  it("un farol del tamaño del bote necesita funcionar el 50%", () => {
    expect(breakevenBluff(100, 100)).toBeCloseTo(0.5, 5);
  });

  it("media apuesta necesita funcionar el 33%", () => {
    expect(breakevenBluff(100, 50)).toBeCloseTo(0.3333, 4);
  });

  it("MDF y breakeven son complementarios", () => {
    expect(minimumDefenceFrequency(100, 75) + breakevenBluff(100, 75)).toBeCloseTo(1, 10);
  });
});

describe("implied odds", () => {
  it("pide cero extra si la call ya es rentable", () => {
    expect(impliedOddsNeeded(150, 50, 0.4)).toBe(0);
  });

  it("calcula cuánto más hay que ganar cuando no lo es", () => {
    // 20% de equity pagando 50: necesitas 200 de bote y ya hay 150 -> faltan 50.
    expect(impliedOddsNeeded(150, 50, 0.2)).toBeCloseTo(50, 5);
  });
});
