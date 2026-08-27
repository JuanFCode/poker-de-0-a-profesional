import { describe, expect, it } from "vitest";
import {
  ADJUSTMENTS,
  callChart,
  reshoveChart,
  RESHOVE_ANCHORS,
  rivalZoneOf,
  shoveChart,
  SHOVE_ANCHORS,
  zoneFor,
} from "./pushfold";
import { ALL_HANDS } from "./notation";
import { POSITIONS, positionsFor, type Position, type TableSize } from "./ranges";

const isSubset = (small: Set<string>, big: Set<string>): boolean =>
  [...small].every((hand) => big.has(hand));

/** Las manos que sobran del rango, para que el error diga cuáles son. */
const extras = (small: Set<string>, big: Set<string>): string[] =>
  [...small].filter((hand) => !big.has(hand));

describe("tablas de push o fold", () => {
  it("solo contienen manos que existen", () => {
    const known = new Set(ALL_HANDS);
    for (const size of [9, 6] as TableSize[]) {
      for (const position of positionsFor(size)) {
        for (const stack of [6, 8, 12, 16]) {
          const charts = [
            shoveChart(position, size, stack),
            callChart(position, size, stack),
            reshoveChart(position, size, stack),
          ];
          for (const chart of charts) {
            if (!chart) continue;
            expect([...chart.hands].every((hand) => known.has(hand))).toBe(true);
          }
        }
      }
    }
  });

  it("cuanto más corto el stack, más ancho se empuja", () => {
    for (const position of positionsFor(6)) {
      for (let i = 1; i < SHOVE_ANCHORS.length; i++) {
        const corto = shoveChart(position, 6, SHOVE_ANCHORS[i - 1]);
        const largo = shoveChart(position, 6, SHOVE_ANCHORS[i]);
        if (!corto || !largo) continue;
        expect(extras(largo.hands, corto.hands)).toEqual([]);
        expect(largo.percent).toBeLessThan(corto.percent);
      }
    }
  });

  it("cuanto más tarde hablas, más ancho se empuja", () => {
    const orden: Position[] = ["LJ", "HJ", "CO", "BTN", "SB"];
    for (const stack of SHOVE_ANCHORS) {
      for (let i = 1; i < orden.length; i++) {
        const antes = shoveChart(orden[i - 1], 6, stack)!;
        const despues = shoveChart(orden[i], 6, stack)!;
        expect(isSubset(antes.hands, despues.hands)).toBe(true);
        expect(despues.percent).toBeGreaterThan(antes.percent);
      }
    }
  });

  it("pagar es más cerrado que empujar desde la misma silla", () => {
    for (const stack of SHOVE_ANCHORS) {
      for (const position of positionsFor(6)) {
        const shove = shoveChart(position, 6, stack);
        if (!shove) continue;
        expect(callChart(position, 6, stack).percent).toBeLessThan(shove.percent);
      }
    }
  });

  it("se paga más ancho al que empuja desde el botón que al de las primeras sillas", () => {
    for (const stack of SHOVE_ANCHORS) {
      const tardía = callChart("BTN", 6, stack);
      const media = callChart("HJ", 6, stack);
      const temprana = callChart("LJ", 6, stack);
      expect(tardía.percent).toBeGreaterThan(media.percent);
      expect(media.percent).toBeGreaterThan(temprana.percent);
      expect(isSubset(temprana.hands, media.hands)).toBe(true);
      expect(isSubset(media.hands, tardía.hands)).toBe(true);
    }
  });

  it("la resubida all-in se cierra según crece el stack", () => {
    for (const opener of ["BTN", "HJ", "LJ"] as Position[]) {
      for (let i = 1; i < RESHOVE_ANCHORS.length; i++) {
        const corto = reshoveChart(opener, 6, RESHOVE_ANCHORS[i - 1]);
        const largo = reshoveChart(opener, 6, RESHOVE_ANCHORS[i]);
        expect(extras(largo.hands, corto.hands)).toEqual([]);
        expect(largo.percent).toBeLessThan(corto.percent);
      }
    }
  });

  it("la ciega grande no empuja un bote que ya ha ganado", () => {
    expect(shoveChart("BB", 6, 8)).toBeNull();
  });

  it("usa la tabla del tramo que toca y la más larga por encima", () => {
    expect(shoveChart("BTN", 6, 5)!.anchor).toBe(6);
    expect(shoveChart("BTN", 6, 7)!.anchor).toBe(8);
    expect(shoveChart("BTN", 6, 12)!.anchor).toBe(12);
    expect(shoveChart("BTN", 6, 40)!.anchor).toBe(16);
    expect(reshoveChart("BTN", 6, 19)!.anchor).toBe(20);
  });

  it("la misma gente detrás da el mismo rango en mesas distintas", () => {
    // El botón de una mesa de 6 y el de una de 9 tienen dos sillas detrás.
    expect(shoveChart("BTN", 6, 10)!.notation).toBe(shoveChart("BTN", 9, 10)!.notation);
    // El primero en hablar en 6-max juega como el lojack de una mesa de 9.
    expect(shoveChart("LJ", 6, 10)!.notation).toBe(shoveChart("UTG", 9, 10)!.notation);
  });

  it("cada silla cae en la zona de rival que le toca", () => {
    expect(rivalZoneOf("BTN", 6)).toBe("tardía");
    expect(rivalZoneOf("SB", 6)).toBe("tardía");
    expect(rivalZoneOf("CO", 6)).toBe("media");
    expect(rivalZoneOf("LJ", 6)).toBe("temprana");
    expect(rivalZoneOf("UTG", 9)).toBe("temprana");
  });

  it("los tramos de stack van del all-in al poker normal", () => {
    expect(zoneFor(8).zone).toBe("empujar");
    expect(zoneFor(13).zone).toBe("mixto");
    expect(zoneFor(19).zone).toBe("resubir");
    expect(zoneFor(40).zone).toBe("profundo");
  });

  it("no deja ninguna silla sin tabla salvo la ciega grande", () => {
    for (const position of POSITIONS) {
      const chart = shoveChart(position, 9, 10);
      if (position === "BB") expect(chart).toBeNull();
      else expect(chart!.hands.size).toBeGreaterThan(0);
    }
  });

  it("los ajustes de bounty e ICM están escritos", () => {
    expect(ADJUSTMENTS.length).toBeGreaterThanOrEqual(4);
    expect(ADJUSTMENTS.every((entry) => entry.detail.length > 40)).toBe(true);
  });
});
