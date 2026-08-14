import { describe, expect, it } from "vitest";
import { actionFor, OPENING_POSITIONS, percentFor, POSITION_LIST, rangeFor } from "./ranges";

describe("rangos de apertura", () => {
  it("todas las posiciones abren salvo la ciega grande", () => {
    expect(OPENING_POSITIONS).toHaveLength(8);
    expect(OPENING_POSITIONS).not.toContain("BB");
    expect(rangeFor("BB", "open").size).toBe(0);
  });

  it("se van abriendo a medida que avanza la posición", () => {
    const order = ["UTG", "UTG+2", "LJ", "HJ", "CO", "BTN"] as const;
    for (let i = 1; i < order.length; i++) {
      expect(percentFor(order[i], "open")).toBeGreaterThan(percentFor(order[i - 1], "open"));
    }
  });

  it("se mantienen en rangos razonables para 9-max", () => {
    expect(percentFor("UTG", "open")).toBeGreaterThan(5);
    expect(percentFor("UTG", "open")).toBeLessThan(14);
    expect(percentFor("BTN", "open")).toBeGreaterThan(38);
    expect(percentFor("BTN", "open")).toBeLessThan(55);
  });

  it("AA se abre desde todas partes y 72o desde ninguna", () => {
    for (const position of OPENING_POSITIONS) {
      expect(actionFor(position, "AA", "open")).toBe("raise");
      expect(actionFor(position, "72o", "open")).toBe("fold");
    }
  });

  it("el botón abre manos que UTG tira", () => {
    expect(actionFor("UTG", "K9s", "open")).toBe("fold");
    expect(actionFor("BTN", "K9s", "open")).toBe("raise");
  });

  it("todo rango de apertura contiene las premium", () => {
    for (const position of OPENING_POSITIONS) {
      const range = rangeFor(position, "open");
      for (const hand of ["AA", "KK", "QQ", "AKs", "AKo"]) expect(range.has(hand)).toBe(true);
    }
  });
});

describe("3-bet", () => {
  it("es siempre más estrecho que el de apertura", () => {
    for (const position of OPENING_POSITIONS) {
      expect(percentFor(position, "threeBet")).toBeLessThan(percentFor(position, "open"));
    }
  });

  it("las posiciones tempranas resuben más fuerte que el botón", () => {
    expect(percentFor("UTG", "threeBet")).toBeLessThan(percentFor("BTN", "threeBet"));
  });

  it("marca 3bet, call y fold en la ciega grande", () => {
    expect(actionFor("BB", "AA", "threeBet")).toBe("3bet");
    expect(actionFor("BB", "76s", "threeBet")).toBe("call");
    expect(actionFor("BB", "72o", "threeBet")).toBe("fold");
  });
});

describe("metadatos de posición", () => {
  it("cada posición tiene nombre, zona e idea", () => {
    for (const info of POSITION_LIST) {
      expect(info.name.length).toBeGreaterThan(0);
      expect(info.idea.length).toBeGreaterThan(20);
      expect(info.zone).toBeTruthy();
    }
  });
});
