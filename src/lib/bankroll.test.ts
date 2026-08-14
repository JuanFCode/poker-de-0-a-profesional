import { describe, expect, it } from "vitest";
import { checkBankroll, maxBuyIn, sessionProfit, summarize, type Session } from "./bankroll";

const session = (over: Partial<Session> & { id: string }): Session => ({
  date: "2026-01-01",
  format: "cash",
  stakes: "NL10",
  bigBlind: 0.1,
  buyIn: 10,
  cashOut: 10,
  hours: 1,
  hands: 100,
  ...over,
});

describe("resultado de una sesión", () => {
  it("es lo que sacas menos lo que metiste", () => {
    expect(sessionProfit(session({ id: "a", buyIn: 10, cashOut: 25 }))).toBe(15);
    expect(sessionProfit(session({ id: "b", buyIn: 10, cashOut: 0 }))).toBe(-10);
  });
});

describe("resumen", () => {
  it("sin sesiones no inventa números", () => {
    const summary = summarize([]);
    expect(summary.count).toBe(0);
    expect(summary.profit).toBe(0);
    expect(summary.perHour).toBe(0);
    expect(summary.bbPer100).toBeNull();
    expect(summary.curve).toEqual([]);
  });

  it("calcula el win-rate en bb/100", () => {
    // 5€ de beneficio a NL10 (bb = 0,10€) = 50bb en 1000 manos = 5 bb/100.
    const summary = summarize([
      session({ id: "a", buyIn: 10, cashOut: 15, hands: 1000, hours: 2 }),
    ]);
    expect(summary.bbPer100).toBeCloseTo(5, 5);
    expect(summary.perHour).toBeCloseTo(2.5, 5);
  });

  it("ignora para el bb/100 las sesiones sin manos contadas", () => {
    const summary = summarize([
      session({ id: "a", buyIn: 10, cashOut: 15, hands: 1000 }),
      session({ id: "b", format: "mtt", buyIn: 5, cashOut: 50, hands: 0, bigBlind: 0 }),
    ]);
    expect(summary.bbPer100).toBeCloseTo(5, 5);
    expect(summary.profit).toBe(50);
  });

  it("ordena la curva por fecha y acumula", () => {
    const summary = summarize([
      session({ id: "b", date: "2026-02-01", buyIn: 10, cashOut: 0 }),
      session({ id: "a", date: "2026-01-01", buyIn: 10, cashOut: 30 }),
    ]);
    expect(summary.curve.map((p) => p.total)).toEqual([20, 10]);
    expect(summary.bestSession).toBe(20);
    expect(summary.worstSession).toBe(-10);
    expect(summary.winningSessions).toBe(1);
  });

  it("mide la peor caída desde un máximo", () => {
    const summary = summarize([
      session({ id: "a", date: "2026-01-01", buyIn: 10, cashOut: 40 }), // +30
      session({ id: "b", date: "2026-01-02", buyIn: 10, cashOut: 0 }), // -10 -> 20
      session({ id: "c", date: "2026-01-03", buyIn: 10, cashOut: 0 }), // -10 -> 10
      session({ id: "d", date: "2026-01-04", buyIn: 10, cashOut: 35 }), // +25 -> 35
    ]);
    expect(summary.maxDrawdown).toBe(20);
    expect(summary.profit).toBe(35);
  });
});

describe("semáforo de bankroll", () => {
  it("50 buy-ins de cash es luz verde", () => {
    expect(checkBankroll(500, 10, "cash").level).toBe("ok");
  });

  it("entre el mínimo y el recomendado avisa", () => {
    expect(checkBankroll(350, 10, "cash").level).toBe("justo");
  });

  it("por debajo del mínimo manda bajar de nivel", () => {
    expect(checkBankroll(200, 10, "cash").level).toBe("riesgo");
  });

  it("los torneos piden mucho más que el cash", () => {
    expect(checkBankroll(500, 10, "mtt").level).toBe("riesgo");
    expect(maxBuyIn(1000, "mtt")).toBeLessThan(maxBuyIn(1000, "cash"));
  });

  it("no revienta con buy-in cero", () => {
    expect(checkBankroll(500, 0, "cash").level).toBe("riesgo");
  });
});
