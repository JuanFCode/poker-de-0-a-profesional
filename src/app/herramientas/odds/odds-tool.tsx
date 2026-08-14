"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardPicker, CardSlots } from "@/components/card-picker";
import { Stat, ToolShell } from "@/components/tool-shell";
import { formatCard, type Card } from "@/lib/poker/cards";
import type { EquityInput, EquityResult, Opponent } from "@/lib/poker/equity";
import { expandRange } from "@/lib/poker/notation";
import { POSITION_TABLE } from "@/lib/poker/ranges";
import {
  breakevenBluff,
  callEV,
  COMMON_DRAWS,
  equityFromOuts,
  impliedOddsNeeded,
  minimumDefenceFrequency,
  potOddsRatio,
  requiredEquity,
  ruleOf2and4,
  type Street,
} from "@/lib/poker/odds";

const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export function OddsTool() {
  return (
    <ToolShell
      eyebrow="Herramienta 02"
      title="Odds y equity"
      intro="Arriba, la cuenta rápida que se hace en la mesa: precio, outs y si la call gana dinero. Abajo, la simulación completa contra una mano concreta o contra un rango entero."
    >
      <PotOddsPanel />
      <div className="rule-brass my-14" />
      <EquityPanel />
    </ToolShell>
  );
}

/* ------------------------------------------------------------------ pot odds */

function PotOddsPanel() {
  const [pot, setPot] = useState(100);
  const [bet, setBet] = useState(50);
  const [outs, setOuts] = useState(9);
  const [street, setStreet] = useState<Street>("flop");

  const potWithBet = pot + bet;
  const needed = requiredEquity(potWithBet, bet);
  const real = equityFromOuts(outs, street);
  const quick = ruleOf2and4(outs, street);
  const ev = callEV(real, potWithBet, bet);
  const implied = impliedOddsNeeded(potWithBet, bet, real);

  return (
    <section>
      <h2 className="font-display text-3xl tracking-tight text-cream">Pot odds y outs</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream-dim">
        Introduce el bote antes de su apuesta, lo que ha apostado y tus outs.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="surface space-y-5 rounded-xl p-6">
          <NumberField label="Bote (antes de su apuesta)" value={pot} onChange={setPot} min={1} />
          <NumberField label="Su apuesta" value={bet} onChange={setBet} min={0} />
          <div>
            <NumberField label="Tus outs" value={outs} onChange={setOuts} min={0} max={21} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {COMMON_DRAWS.map((draw) => (
                <button
                  key={draw.name}
                  type="button"
                  onClick={() => setOuts(draw.outs)}
                  title={draw.note}
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-colors ${
                    outs === draw.outs
                      ? "border-brass-400 bg-brass-500/15 text-brass-200"
                      : "border-brass-500/20 text-cream-faint hover:border-brass-500/50"
                  }`}
                >
                  {draw.outs} · {draw.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint">
              ¿En qué calle estás?
            </p>
            <div className="mt-2 flex gap-2">
              {(["flop", "turn"] as Street[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStreet(value)}
                  className={`flex-1 rounded-lg border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                    street === value
                      ? "border-brass-400 bg-brass-500/15 text-brass-200"
                      : "border-brass-500/20 text-cream-faint hover:border-brass-500/50"
                  }`}
                >
                  {value === "flop" ? "Flop (2 cartas)" : "Turn (1 carta)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div
            className={`rounded-xl border p-6 ${
              ev > 0 ? "border-action-call/40 bg-action-call/5" : "border-suit-red/40 bg-suit-red/5"
            }`}
          >
            <p className="eyebrow">Veredicto</p>
            <p
              className={`mt-2 font-display text-3xl ${ev > 0 ? "text-action-call" : "text-suit-red"}`}
            >
              {ev > 0 ? "Igualar gana dinero" : "Igualar pierde dinero"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-cream-dim">
              Necesitas <span className="text-cream">{pct(needed)}</span> de equity y tienes{" "}
              <span className="text-cream">{pct(real)}</span>. Cada vez que pagas aquí,{" "}
              {ev > 0 ? "ganas" : "pierdes"} de media{" "}
              <span className="text-cream">{Math.abs(ev).toFixed(1)}</span> fichas.
            </p>
            {ev <= 0 && implied > 0 && Number.isFinite(implied) && (
              <p className="mt-3 text-sm leading-relaxed text-cream-faint">
                Solo compensa si esperas sacarle al menos{" "}
                <span className="text-brass-300">{implied.toFixed(0)}</span> fichas más en las
                calles siguientes (implied odds).
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Equity necesaria" value={pct(needed)} hint={`Pot odds ${potOddsRatio(potWithBet, bet).toFixed(1)} : 1`} />
            <Stat label="Tu equity real" value={pct(real)} hint={`${outs} outs`} />
            <Stat label="Regla del 2 y el 4" value={pct(quick, 0)} hint="La cuenta de mesa" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Si faroleas ese tamaño"
              value={pct(breakevenBluff(pot, bet))}
              hint="Veces que tiene que funcionar"
            />
            <Stat
              label="Defensa mínima (MDF)"
              value={pct(minimumDefenceFrequency(pot, bet))}
              hint="Cuánto de tu rango debes defender"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isNaN(next)) return;
          onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next)));
        }}
        className="mt-1.5 w-full rounded-lg border border-brass-500/20 bg-felt-900 px-3 py-2 font-mono text-sm text-cream focus:border-brass-400 focus:outline-none"
      />
    </label>
  );
}

/* -------------------------------------------------------------------- equity */

type Slot = "hero" | "villain" | "board";
type VillainMode = "cards" | "range" | "random";

const RANGE_PRESETS = [
  { label: "Premium", value: "QQ+, AKs, AKo" },
  { label: "3-bet del botón", value: POSITION_TABLE.BTN.threeBet },
  { label: "Apertura UTG", value: POSITION_TABLE.UTG.open ?? "" },
  { label: "Apertura botón", value: POSITION_TABLE.BTN.open ?? "" },
  { label: "Defensa de BB", value: POSITION_TABLE.BB.call ?? "" },
];

export function EquityPanel() {
  const [hero, setHero] = useState<Card[]>([]);
  const [villain, setVillain] = useState<Card[]>([]);
  const [board, setBoard] = useState<Card[]>([]);
  const [slot, setSlot] = useState<Slot>("hero");
  const [mode, setMode] = useState<VillainMode>("cards");
  const [rangeText, setRangeText] = useState("QQ+, AKs, AKo");
  const [result, setResult] = useState<EquityResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./equity.worker.ts", import.meta.url));
    worker.onmessage = (event: MessageEvent<EquityResult>) => {
      setResult(event.data);
      setRunning(false);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const used = useMemo(() => [...hero, ...villain, ...board], [hero, villain, board]);

  const rangeHands = useMemo(() => {
    if (mode !== "range") return null;
    try {
      const hands = [...expandRange(rangeText)];
      return hands.length > 0 ? hands : null;
    } catch {
      return null;
    }
  }, [mode, rangeText]);

  const rangeInvalid = mode === "range" && rangeText.trim().length > 0 && rangeHands === null;

  // Actualización funcional: dos clics seguidos en el mismo frame no pueden
  // pisarse el uno al otro, que es justo lo que pasa al elegir cartas rápido.
  const pick = (card: Card) => {
    setResult(null);
    const append = (limit: number) => (current: Card[]) =>
      current.length < limit && !current.includes(card) ? [...current, card] : current;

    if (slot === "hero") setHero(append(2));
    else if (slot === "villain") setVillain(append(2));
    else if (slot === "board") setBoard(append(5));
  };

  const run = () => {
    setError(null);
    if (hero.length !== 2) {
      setError("Elige tus dos cartas.");
      return;
    }
    if (mode === "cards" && villain.length !== 2) {
      setError("Elige las dos cartas del rival, o cambia a rango.");
      return;
    }
    if (mode === "range" && !rangeHands) {
      setError("Ese rango no se entiende. Ejemplo: 22+, A2s+, KTo+");
      return;
    }
    if (board.length === 1 || board.length === 2) {
      setError("El board tiene 0, 3, 4 o 5 cartas.");
      return;
    }

    const opponent: Opponent =
      mode === "cards"
        ? { kind: "cards", cards: villain }
        : mode === "range"
          ? { kind: "range", hands: rangeHands! }
          : { kind: "random" };

    const input: EquityInput = {
      hero,
      opponents: [opponent],
      board,
      iterations: 60_000,
      seed: Date.now() & 0xffffff,
    };

    setRunning(true);
    workerRef.current?.postMessage(input);
  };

  const reset = () => {
    setHero([]);
    setVillain([]);
    setBoard([]);
    setResult(null);
    setError(null);
    setSlot("hero");
  };

  return (
    <section>
      <h2 className="font-display text-3xl tracking-tight text-cream">Equity</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream-dim">
        Elige un hueco, pulsa las cartas y dale a calcular. Con el board completo el resultado es
        exacto; en el resto de casos se simulan 60.000 manos.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <CardSlots
              label="Tu mano"
              cards={hero}
              capacity={2}
              active={slot === "hero"}
              onActivate={() => setSlot("hero")}
              onRemove={(index) => {
                setHero(hero.filter((_, i) => i !== index));
                setResult(null);
              }}
            />
            <div
              className={`rounded-xl border p-4 transition-colors ${
                slot === "villain" && mode === "cards"
                  ? "border-brass-400 bg-brass-500/5"
                  : "border-brass-500/15"
              }`}
            >
              <div className="flex flex-wrap gap-1.5">
                {(["cards", "range", "random"] as VillainMode[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setMode(value);
                      setResult(null);
                      if (value === "cards") setSlot("villain");
                    }}
                    className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      mode === value
                        ? "bg-brass-500/20 text-brass-200"
                        : "text-cream-faint hover:text-brass-300"
                    }`}
                  >
                    {value === "cards" ? "Rival: cartas" : value === "range" ? "Rango" : "Al azar"}
                  </button>
                ))}
              </div>

              {mode === "cards" && (
                <div className="mt-3 flex gap-2">
                  {[0, 1].map((index) => {
                    const card = villain[index];
                    return card === undefined ? (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSlot("villain")}
                        aria-label="Hueco vacío del rival"
                        className="h-16 w-12 rounded-card border border-dashed border-brass-500/25 hover:border-brass-400"
                      />
                    ) : (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setVillain(villain.filter((_, i) => i !== index));
                          setResult(null);
                        }}
                        aria-label="Quitar carta del rival"
                      >
                        <span className="inline-flex">
                          <CardChip card={card} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {mode === "range" && (
                <div className="mt-3">
                  <textarea
                    value={rangeText}
                    onChange={(event) => {
                      setRangeText(event.target.value);
                      setResult(null);
                    }}
                    rows={2}
                    className={`w-full rounded-lg border bg-felt-900 px-3 py-2 font-mono text-[11px] text-cream focus:outline-none ${
                      rangeInvalid ? "border-suit-red" : "border-brass-500/20 focus:border-brass-400"
                    }`}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {RANGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setRangeText(preset.value);
                          setResult(null);
                        }}
                        className="rounded-full border border-brass-500/20 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-cream-faint hover:border-brass-500/50 hover:text-brass-300"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-cream-faint">
                    {rangeHands ? `${rangeHands.length} manos distintas` : "Rango no válido"}
                  </p>
                </div>
              )}

              {mode === "random" && (
                <p className="mt-3 text-sm leading-relaxed text-cream-faint">
                  El rival lleva dos cartas cualesquiera. Sirve para ver cuánto vale tu mano en
                  bruto, antes de cualquier lectura.
                </p>
              )}
            </div>
          </div>

          <CardSlots
            label="Board (flop, turn y river)"
            cards={board}
            capacity={5}
            active={slot === "board"}
            onActivate={() => setSlot("board")}
            onRemove={(index) => {
              setBoard(board.filter((_, i) => i !== index));
              setResult(null);
            }}
          />

          <div className="surface rounded-xl p-4">
            <CardPicker used={used} onPick={pick} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="rounded-full bg-brass-500 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-felt-950 transition-colors hover:bg-brass-300 disabled:opacity-50"
            >
              {running ? "Calculando…" : "Calcular equity"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-brass-500/25 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-cream-faint hover:border-brass-500/60 hover:text-brass-300"
            >
              Limpiar
            </button>
            {error && <p className="font-mono text-[11px] text-suit-red">{error}</p>}
          </div>
        </div>

        <aside className="space-y-4">
          {result ? (
            <>
              <div className="surface rounded-xl p-6">
                <p className="eyebrow">{result.exact ? "Resultado exacto" : "Simulación"}</p>
                <EquityBar label="Tú" value={result.hero.equity} tone="brass" />
                <EquityBar label="Rival" value={result.opponents[0].equity} tone="red" />
                <p className="mt-4 font-mono text-[10px] text-cream-faint">
                  {result.exact
                    ? `${result.iterations.toLocaleString("es-ES")} repartos enumerados`
                    : `${result.iterations.toLocaleString("es-ES")} manos simuladas`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Stat label="Ganas" value={pct(result.hero.win)} />
                <Stat label="Empatas" value={pct(result.hero.tie)} />
              </div>

              <div className="surface rounded-xl p-5">
                <p className="eyebrow">Qué precio aguanta</p>
                <p className="mt-2 text-sm leading-relaxed text-cream-dim">
                  {result.hero.equity >= 0.5 ? (
                    <>
                      Con {pct(result.hero.equity)} de equity eres favorito: puedes pagar{" "}
                      <span className="text-brass-300">cualquier apuesta</span>, incluido el all-in.
                    </>
                  ) : (
                    <>
                      Con {pct(result.hero.equity)} de equity puedes pagar hasta una apuesta de{" "}
                      <span className="text-brass-300">
                        {maxCallableBet(result.hero.equity).toFixed(0)}%
                      </span>{" "}
                      del bote.
                    </>
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="surface rounded-xl p-6">
              <p className="eyebrow">Sin resultados todavía</p>
              <p className="mt-3 text-sm leading-relaxed text-cream-faint">
                Elige tu mano y pulsa calcular. Prueba clásicos: A-A contra K-K (81%), o A-K suited
                contra Q-Q (46%).
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

/**
 * Apuesta máxima (en % del bote) que puedes pagar con esa equity.
 * A partir del 50% no hay límite: pagar siempre es rentable.
 */
function maxCallableBet(equity: number): number {
  if (equity >= 0.5) return Infinity;
  return (equity / (1 - 2 * equity)) * 100;
}

function CardChip({ card }: { card: Card }) {
  return (
    <span className="grid h-16 w-12 place-items-center rounded-card border border-black/20 bg-cream font-mono text-sm text-felt-950">
      {formatCard(card)}
    </span>
  );
}

function EquityBar({ label, value, tone }: { label: string; value: number; tone: "brass" | "red" }) {
  return (
    <div className="mt-4 first:mt-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream-faint">
          {label}
        </span>
        <span className="font-display text-2xl text-cream">{pct(value)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-felt-700">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            tone === "brass" ? "bg-brass-500" : "bg-suit-red"
          }`}
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
    </div>
  );
}
