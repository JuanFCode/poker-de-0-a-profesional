import { describe, expect, it } from "vitest";
import { positionsFor, TABLE_SIZES } from "./ranges";
import {
  actsAfter,
  actsBefore,
  hasPositionOn,
  PLAYBOOK,
  playbookFor,
  postflopOrder,
  preflopOrder,
  seatLayout,
  summaryFor,
  turnNumber,
} from "./table";

describe("sillas en la mesa", () => {
  it("coloca todas las sillas, sin repetir y sin perder ninguna", () => {
    for (const size of TABLE_SIZES) {
      for (const hero of positionsFor(size)) {
        const seats = seatLayout(size, hero);
        expect(seats).toHaveLength(size);
        expect(new Set(seats.map((seat) => seat.position)).size).toBe(size);
        expect(new Set(seats.map((seat) => seat.position))).toEqual(new Set(positionsFor(size)));
      }
    }
  });

  it("te sienta siempre abajo en el centro", () => {
    for (const size of TABLE_SIZES) {
      for (const hero of positionsFor(size)) {
        const [first, ...rest] = seatLayout(size, hero);
        expect(first.position).toBe(hero);
        expect(first.isHero).toBe(true);
        expect(first.x).toBeCloseTo(50, 1);
        expect(first.y).toBeGreaterThan(80);
        expect(rest.every((seat) => !seat.isHero)).toBe(true);
      }
    }
  });

  it("reparte en el sentido del juego: el siguiente en hablar es el de tu izquierda", () => {
    const seats = seatLayout(9, "BTN");
    expect(seats.map((seat) => seat.position)).toEqual([
      "BTN",
      "SB",
      "BB",
      "UTG",
      "UTG+1",
      "UTG+2",
      "LJ",
      "HJ",
      "CO",
    ]);
    // La silla que habla después de ti queda a la izquierda de la pantalla.
    expect(seats[1].x).toBeLessThan(50);
  });
});

describe("orden de acción", () => {
  it("preflop empieza el primero tras las ciegas y cierra la ciega grande", () => {
    expect(preflopOrder(9)).toEqual([
      "UTG",
      "UTG+1",
      "UTG+2",
      "LJ",
      "HJ",
      "CO",
      "BTN",
      "SB",
      "BB",
    ]);
    for (const size of TABLE_SIZES) {
      expect(preflopOrder(size).at(-1)).toBe("BB");
    }
  });

  it("postflop hablan primero las ciegas y cierra siempre el botón", () => {
    expect(postflopOrder(9)).toEqual([
      "SB",
      "BB",
      "UTG",
      "UTG+1",
      "UTG+2",
      "LJ",
      "HJ",
      "CO",
      "BTN",
    ]);
    expect(postflopOrder(6)).toEqual(["SB", "BB", "LJ", "HJ", "CO", "BTN"]);
    // En heads-up no hay ciega pequeña aparte: abre la ciega grande.
    expect(postflopOrder(2)).toEqual(["BB", "BTN"]);
    for (const size of TABLE_SIZES) {
      expect(postflopOrder(size).at(-1)).toBe("BTN");
    }
  });

  it("nadie habla después del botón, y la primera ciega no tiene a nadie delante", () => {
    for (const size of TABLE_SIZES) {
      expect(actsAfter("BTN", size)).toEqual([]);
      const first = postflopOrder(size)[0];
      expect(actsBefore(first, size)).toEqual([]);
      expect(turnNumber(first, size)).toBe(1);
      expect(turnNumber("BTN", size)).toBe(size);
    }
  });

  it("antes + tú + después suma la mesa entera", () => {
    for (const size of TABLE_SIZES) {
      for (const seat of positionsFor(size)) {
        expect(actsBefore(seat, size).length + 1 + actsAfter(seat, size).length).toBe(size);
      }
    }
  });

  it("el botón juega en posición contra todos y las ciegas contra nadie", () => {
    expect(hasPositionOn("BTN", "SB", 9)).toBe(true);
    expect(hasPositionOn("SB", "BTN", 9)).toBe(false);
    expect(hasPositionOn("CO", "HJ", 9)).toBe(true);
    for (const seat of positionsFor(9).filter((p) => p !== "SB")) {
      expect(hasPositionOn(seat, "SB", 9)).toBe(true);
    }
  });

  it("preflop las ciegas cierran, aunque postflop hablen primero", () => {
    expect(actsAfter("BB", 9, "preflop")).toEqual([]);
    expect(actsBefore("BB", 9, "preflop")).toHaveLength(8);
    expect(turnNumber("BB", 9, "preflop")).toBe(9);
    expect(turnNumber("BB", 9)).toBe(2);
  });
});

describe("ventaja por silla", () => {
  it("cada silla de cada mesa tiene plan", () => {
    for (const size of TABLE_SIZES) {
      for (const seat of positionsFor(size)) {
        const plan = playbookFor(seat, size);
        expect(plan.edge.length).toBeGreaterThan(20);
        expect(plan.bluff.length).toBeGreaterThan(20);
        expect(summaryFor(seat, size).length).toBeGreaterThan(10);
      }
    }
  });

  it("las mesas cortas reutilizan la silla equivalente de 9-max", () => {
    // El primero en hablar en 6-max tiene cinco por detrás: es el lojack de una mesa de 9.
    expect(playbookFor("LJ", 6)).toBe(PLAYBOOK.LJ);
    // En una mesa de 4 el cutoff sigue teniendo tres por detrás: es el mismo plan.
    expect(playbookFor("CO", 4)).toBe(PLAYBOOK.CO);
    expect(playbookFor("BTN", 9)).toBe(PLAYBOOK.BTN);
  });

  it("el botón gana dinero y las ciegas lo pierden", () => {
    expect(playbookFor("BTN", 9).winrate).toBeGreaterThan(0);
    expect(playbookFor("CO", 9).winrate).toBeGreaterThan(0);
    expect(playbookFor("SB", 9).winrate).toBeLessThan(0);
    expect(playbookFor("BB", 9).winrate).toBeLessThan(playbookFor("SB", 9).winrate);
  });

  it("en heads-up el botón tiene su propio plan", () => {
    expect(playbookFor("BTN", 2)).not.toBe(PLAYBOOK.BTN);
    expect(playbookFor("BTN", 2).winrate).toBeGreaterThan(0);
    expect(playbookFor("BTN", 2).info).toBe("Máxima");
  });
});
