import { describe, expect, it } from "vitest";
import { expandRange, rangePercent, type HandCode } from "./notation";
import { rangeFor, POSITIONS, type Position } from "./ranges";
import {
  actionVs3Bet,
  actionVs4Bet,
  actionVsOpen,
  defenseFor,
  EXPLOIT_ADD,
  exploitAddFor,
  loosePercentFor,
  OPEN_SIZE_EFFECT,
  responseTo3Bet,
  SIZINGS,
  VS_3BET,
  VS_4BET,
  VS_OPEN,
  zoneOf,
  type Zone,
} from "./preflop-tree";

/** Todas las notaciones del módulo, con una etiqueta para saber cuál falla. */
function everyNotation(): [string, string][] {
  const out: [string, string][] = [];
  for (const [zone, seats] of Object.entries(VS_OPEN)) {
    for (const [seat, defense] of Object.entries(seats)) {
      out.push([`VS_OPEN.${zone}.${seat}.threeBet`, defense.threeBet]);
      out.push([`VS_OPEN.${zone}.${seat}.call`, defense.call]);
    }
  }
  for (const [mine, theirs] of Object.entries(VS_3BET)) {
    for (const [zone, response] of Object.entries(theirs)) {
      out.push([`VS_3BET.${mine}.${zone}.fourBet`, response.fourBet]);
      out.push([`VS_3BET.${mine}.${zone}.call`, response.call]);
    }
  }
  for (const [zone, response] of Object.entries(VS_4BET)) {
    out.push([`VS_4BET.${zone}.jam`, response.jam]);
    out.push([`VS_4BET.${zone}.call`, response.call]);
  }
  for (const [seat, notation] of Object.entries(EXPLOIT_ADD)) {
    out.push([`EXPLOIT_ADD.${seat}`, notation]);
  }
  return out;
}

const percent = (notation: string) => rangePercent(expandRange(notation));

describe("notación de las tablas", () => {
  it("toda notación expande sin lanzar y no se queda vacía", () => {
    for (const [label, notation] of everyNotation()) {
      expect(() => expandRange(notation), label).not.toThrow();
      expect(expandRange(notation).size, label).toBeGreaterThan(0);
    }
  });

  it("resubir e igualar nunca se solapan en la misma casilla", () => {
    for (const [zone, seats] of Object.entries(VS_OPEN)) {
      for (const [seat, defense] of Object.entries(seats)) {
        const threeBet = expandRange(defense.threeBet);
        const shared = [...expandRange(defense.call)].filter((hand) => threeBet.has(hand));
        expect(shared, `${zone}/${seat} repite ${shared.join(", ")}`).toHaveLength(0);
      }
    }
    for (const [mine, theirs] of Object.entries(VS_3BET)) {
      for (const [zone, response] of Object.entries(theirs)) {
        const fourBet = expandRange(response.fourBet);
        const shared = [...expandRange(response.call)].filter((hand) => fourBet.has(hand));
        expect(shared, `${mine}/${zone} repite ${shared.join(", ")}`).toHaveLength(0);
      }
    }
    for (const [zone, response] of Object.entries(VS_4BET)) {
      const jam = expandRange(response.jam);
      const shared = [...expandRange(response.call)].filter((hand) => jam.has(hand));
      expect(shared, `${zone} repite ${shared.join(", ")}`).toHaveLength(0);
    }
  });

  it("cada casilla explica por qué juega así", () => {
    for (const seats of Object.values(VS_OPEN)) {
      for (const defense of Object.values(seats)) expect(defense.nota.length).toBeGreaterThan(30);
    }
    for (const theirs of Object.values(VS_3BET)) {
      for (const response of Object.values(theirs)) expect(response.nota.length).toBeGreaterThan(30);
    }
    for (const response of Object.values(VS_4BET)) expect(response.nota.length).toBeGreaterThan(30);
  });
});

describe("zonas", () => {
  it("reparte las nueve sillas en cuatro zonas", () => {
    expect(zoneOf("UTG")).toBe("temprana");
    expect(zoneOf("LJ")).toBe("media");
    expect(zoneOf("BTN")).toBe("tardia");
    expect(zoneOf("BB")).toBe("ciegas");
    for (const seat of POSITIONS) expect(zoneOf(seat)).toBeTruthy();
  });
});

describe("cuando alguien ya ha subido", () => {
  const total = (hero: Position, opener: Position) => {
    const defense = defenseFor(hero, opener);
    return defense ? percent(defense.threeBet) + percent(defense.call) : 0;
  };

  it("defiendes más cuanto más cerca del botón sube el rival", () => {
    // Misma silla (la ciega grande), tres rivales distintos.
    expect(total("BB", "LJ")).toBeGreaterThan(total("BB", "UTG"));
    expect(total("BB", "BTN")).toBeGreaterThan(total("BB", "LJ"));
    expect(total("BB", "SB")).toBeGreaterThan(total("BB", "BTN"));
  });

  it("defiendes más cuanto mejor es tu propia posición", () => {
    // Todos contra la misma apertura temprana.
    expect(total("BTN", "UTG")).toBeGreaterThan(total("CO", "UTG"));
    expect(total("CO", "UTG")).toBeGreaterThan(total("HJ", "UTG"));
    expect(total("HJ", "UTG")).toBeGreaterThan(total("UTG+1", "UTG"));
  });

  it("la ciega pequeña defiende mucho menos que la grande", () => {
    expect(total("SB", "BTN")).toBeLessThan(total("BB", "BTN"));
  });

  it("A-A siempre resube y 7-2o nunca sobrevive", () => {
    for (const [zone, seats] of Object.entries(VS_OPEN)) {
      for (const [seat, defense] of Object.entries(seats)) {
        expect(expandRange(defense.threeBet).has("AA"), `${zone}/${seat}`).toBe(true);
        expect(expandRange(defense.call).has("72o"), `${zone}/${seat}`).toBe(false);
        expect(expandRange(defense.threeBet).has("72o"), `${zone}/${seat}`).toBe(false);
      }
    }
  });

  it("A-5s farolea desde todas partes: bloquea A-A y liga la escalera baja", () => {
    for (const seats of Object.values(VS_OPEN)) {
      for (const defense of Object.values(seats)) {
        expect(expandRange(defense.threeBet).has("A5s")).toBe(true);
      }
    }
  });

  it("contra una apertura temprana el offsuit flojo se tira", () => {
    for (const hand of ["AJo", "KQo", "KJo", "QJo", "JTo"]) {
      expect(actionVsOpen("UTG+1", "UTG", hand), hand).toBe("fold");
    }
    // Y sus versiones suited sí juegan desde una silla decente.
    expect(actionVsOpen("CO", "UTG", "QJs")).not.toBe("fold");
  });

  it("no existe la situación de defender contra alguien que habla después", () => {
    expect(defenseFor("UTG", "BTN")).toBeNull();
    expect(defenseFor("CO", "BTN")).toBeNull();
    expect(defenseFor("BB", "BB")).toBeNull();
  });
});

describe("abriste y te resuben", () => {
  it("desde temprana contra temprana no se 4-betea Q-Q ni J-J", () => {
    expect(actionVs3Bet("UTG", "UTG+1", "QQ")).toBe("call");
    expect(actionVs3Bet("UTG", "UTG+1", "JJ")).toBe("call");
    expect(actionVs3Bet("UTG", "UTG+1", "AA")).toBe("4bet");
    expect(actionVs3Bet("UTG", "UTG+1", "KK")).toBe("4bet");
    expect(actionVs3Bet("UTG", "UTG+1", "AKo")).toBe("4bet");
  });

  it("A-10s va dominada y 9-8s no: el suited conector aguanta y el as flojo no", () => {
    expect(actionVs3Bet("UTG", "UTG+1", "ATs")).toBe("fold");
    expect(actionVs3Bet("UTG", "UTG+1", "98s")).toBe("call");
  });

  it("se 4-betea más ancho cuanto más tarde resube el rival", () => {
    const width = (threeBettor: Position) =>
      percent(responseTo3Bet("UTG", threeBettor)!.fourBet);
    expect(width("BTN")).toBeGreaterThan(width("UTG+1"));
  });

  it("A-A y A-K están siempre en el 4-bet, y 7-2o en ninguna parte", () => {
    for (const theirs of Object.values(VS_3BET)) {
      for (const response of Object.values(theirs)) {
        const fourBet = expandRange(response.fourBet);
        expect(fourBet.has("AA")).toBe(true);
        expect(fourBet.has("AKs")).toBe(true);
        expect(fourBet.has("AKo")).toBe(true);
        expect(fourBet.has("72o")).toBe(false);
        expect(expandRange(response.call).has("72o")).toBe(false);
      }
    }
  });

  it("solo existen las combinaciones que pueden pasar en la mesa", () => {
    // Nadie puede resubirte desde una zona que habla antes que tú.
    expect(responseTo3Bet("BTN", "UTG")).toBeNull();
    expect(responseTo3Bet("HJ", "UTG")).toBeNull();
    expect(responseTo3Bet("SB", "CO")).toBeNull();
  });
});

describe("te han 4-beteado", () => {
  it("es la capa más cerrada del árbol", () => {
    for (const zone of Object.keys(VS_4BET) as Zone[]) {
      const width = percent(VS_4BET[zone].jam) + percent(VS_4BET[zone].call);
      expect(width, zone).toBeLessThan(6);
    }
  });

  it("en posición se iguala con A-A para proteger el rango de call", () => {
    expect(actionVs4Bet("BTN", "AA")).toBe("call");
    expect(actionVs4Bet("BTN", "KK")).toBe("allin");
  });

  it("fuera de posición no se protege nada: A-A entra", () => {
    expect(actionVs4Bet("BB", "AA")).toBe("allin");
    expect(actionVs4Bet("UTG", "AA")).toBe("allin");
  });

  it("A-K nunca se tira", () => {
    for (const seat of ["UTG", "LJ", "BTN", "BB"] as Position[]) {
      expect(actionVs4Bet(seat, "AKs"), seat).not.toBe("fold");
      expect(actionVs4Bet(seat, "AKo"), seat).not.toBe("fold");
    }
  });

  it("todo lo demás se tira", () => {
    expect(actionVs4Bet("UTG", "AQs")).toBe("fold");
    expect(actionVs4Bet("UTG", "TT")).toBe("fold");
    expect(actionVs4Bet("BB", "76s")).toBe("fold");
  });

  it("A-A y K-K nunca se tiran, desde ninguna zona", () => {
    for (const response of Object.values(VS_4BET)) {
      const dentro = new Set([...expandRange(response.jam), ...expandRange(response.call)]);
      expect(dentro.has("AA")).toBe(true);
      expect(dentro.has("KK")).toBe(true);
    }
  });
});

describe("añadidos explotativos", () => {
  it("no repiten ninguna mano del rango base", () => {
    for (const seat of Object.keys(EXPLOIT_ADD) as Position[]) {
      const base = rangeFor(seat, "open");
      const repetidas = [...exploitAddFor(seat)].filter((hand: HandCode) => base.has(hand));
      expect(repetidas, `${seat} repite ${repetidas.join(", ")}`).toHaveLength(0);
    }
  });

  it("ensanchan de verdad, pero ninguna silla pasa del 60% de manos", () => {
    for (const seat of Object.keys(EXPLOIT_ADD) as Position[]) {
      const base = rangePercent(rangeFor(seat, "open"));
      const suelto = loosePercentFor(seat);
      expect(suelto, seat).toBeGreaterThan(base);
      expect(suelto, seat).toBeLessThan(60);
    }
  });

  it("el rango suelto sigue ensanchándose según avanza la posición", () => {
    const orden: Position[] = ["UTG", "UTG+1", "UTG+2", "LJ", "HJ", "CO", "BTN"];
    for (let i = 1; i < orden.length; i++) {
      expect(loosePercentFor(orden[i]), orden[i]).toBeGreaterThan(loosePercentFor(orden[i - 1]));
    }
  });

  it("ni siquiera la mesa más floja hace jugable la basura offsuit", () => {
    for (const seat of Object.keys(EXPLOIT_ADD) as Position[]) {
      for (const hand of ["72o", "83o", "94o", "T2o"]) {
        expect(exploitAddFor(seat).has(hand), `${seat} / ${hand}`).toBe(false);
      }
    }
  });
});

describe("tamaños", () => {
  it("cada tamaño viene con su motivo", () => {
    expect(SIZINGS.length).toBeGreaterThanOrEqual(5);
    for (const sizing of SIZINGS) {
      expect(sizing.situacion.length).toBeGreaterThan(3);
      expect(sizing.tamano.length).toBeGreaterThan(1);
      expect(sizing.porque.length).toBeGreaterThan(30);
    }
  });

  it("la ciega pequeña abre más grande que el resto de sillas", () => {
    const abrir = SIZINGS.find((s) => s.situacion === "Abrir el bote");
    const ciega = SIZINGS.find((s) => s.situacion === "Abrir desde la ciega pequeña");
    expect(abrir?.tamano).toBe("3bb");
    expect(ciega?.tamano).toBe("4bb");
  });

  it("la tabla de tamaños de apertura va de menor a mayor", () => {
    expect(OPEN_SIZE_EFFECT).toHaveLength(4);
    expect(OPEN_SIZE_EFFECT[0].tamano).toContain("2bb");
  });
});
