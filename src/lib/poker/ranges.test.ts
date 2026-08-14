import { describe, expect, it } from "vitest";
import {
  actionFor,
  aliasFor,
  OPENING_POSITIONS,
  openingPositionsFor,
  percentFor,
  POSITION_LIST,
  positionsFor,
  rangeFor,
  seatsBehind,
  TABLE_SIZES,
} from "./ranges";

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

describe("tamaño de mesa", () => {
  it("quita las sillas más tempranas al reducir jugadores", () => {
    expect(positionsFor(9)).toHaveLength(9);
    expect(positionsFor(6)).toEqual(["LJ", "HJ", "CO", "BTN", "SB", "BB"]);
    expect(positionsFor(3)).toEqual(["BTN", "SB", "BB"]);
  });

  it("cada mesa tiene tantas sillas como jugadores, sin repetir", () => {
    for (const size of TABLE_SIZES) {
      const seats = positionsFor(size);
      expect(seats).toHaveLength(size);
      expect(new Set(seats).size).toBe(size);
      expect(seats[seats.length - 1]).toBe("BB");
    }
  });

  it("de 7 a 9 jugadores el primero en hablar se sigue llamando UTG", () => {
    for (const size of [9, 8, 7] as const) expect(positionsFor(size)[0]).toBe("UTG");
    expect(positionsFor(8)).not.toContain("UTG+2");
    expect(positionsFor(7)).not.toContain("UTG+1");
  });

  it("en heads-up el botón es también la ciega pequeña", () => {
    expect(positionsFor(2)).toEqual(["BTN", "BB"]);
    expect(aliasFor("BTN", 2)).toBe("BTN/SB");
  });

  it("marca como UTG a la primera silla de las mesas cortas", () => {
    expect(aliasFor("LJ", 6)).toBe("LJ (UTG)");
    expect(aliasFor("UTG", 9)).toBeNull();
    expect(aliasFor("CO", 9)).toBeNull();
  });

  it("cuenta bien los jugadores que quedan por hablar", () => {
    expect(seatsBehind("UTG", 9)).toBe(8);
    expect(seatsBehind("BTN", 9)).toBe(2);
    expect(seatsBehind("SB", 9)).toBe(1);
    expect(seatsBehind("LJ", 6)).toBe(5); // primero en hablar en 6-max
    expect(seatsBehind("BTN", 3)).toBe(2); // el botón siempre tiene las dos ciegas detrás
  });

  it("el botón abre igual en cualquier mesa: siempre tiene dos por detrás", () => {
    for (const size of [9, 6, 4, 3] as const) {
      expect(percentFor("BTN", "open", size)).toBeCloseTo(percentFor("BTN", "open", 9), 5);
    }
  });

  it("el primero en hablar abre más cuanto más corta es la mesa", () => {
    const firstSeatPercent = (size: 9 | 8 | 7 | 6 | 5 | 4) =>
      percentFor(positionsFor(size)[0], "open", size);
    for (const [smaller, bigger] of [
      [8, 9],
      [7, 8],
      [6, 7],
      [5, 6],
      [4, 5],
    ] as const) {
      expect(firstSeatPercent(smaller)).toBeGreaterThan(firstSeatPercent(bigger));
    }
  });

  it("en heads-up el botón abre la mayoría de las manos", () => {
    const percent = percentFor("BTN", "open", 2);
    expect(percent).toBeGreaterThan(70);
    expect(percent).toBeLessThan(95);
    // Manos que en 9-max se tiran desde el botón y en heads-up se abren.
    expect(actionFor("BTN", "J6o", "open", 2)).toBe("raise");
    expect(actionFor("BTN", "J6o", "open", 9)).toBe("fold");
    expect(actionFor("BTN", "K2o", "open", 2)).toBe("raise");
    // Ni siquiera en heads-up se abre la peor basura offsuit.
    expect(actionFor("BTN", "32o", "open", 2)).toBe("fold");
  });

  it("la ciega grande nunca abre, sea cual sea la mesa", () => {
    for (const size of TABLE_SIZES) {
      expect(rangeFor("BB", "open", size).size).toBe(0);
      expect(openingPositionsFor(size)).not.toContain("BB");
      expect(openingPositionsFor(size)).toHaveLength(size - 1);
    }
  });

  it("la ciega grande de heads-up defiende muchísimo más que la de 9-max", () => {
    expect(percentFor("BB", "call", 2)).toBeGreaterThan(percentFor("BB", "call", 9));
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
