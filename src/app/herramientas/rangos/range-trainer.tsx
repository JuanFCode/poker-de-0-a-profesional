"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ACTION_LABEL, GridLegend, HandGrid } from "@/components/hand-grid";
import { Stat, ToolShell } from "@/components/tool-shell";
import { PlayingCard } from "@/components/playing-card";
import { makeCard, rankIndex, type Card } from "@/lib/poker/cards";
import { ALL_HANDS, comboCount, type HandCode } from "@/lib/poker/notation";
import {
  actionFor,
  aliasFor,
  notationFor,
  openingPositionsFor,
  percentFor,
  POSITION_TABLE,
  positionsFor,
  seatsBehind,
  TABLE_LABELS,
  TABLE_SIZES,
  type Action,
  type Position,
  type RangeKind,
  type TableSize,
} from "@/lib/poker/ranges";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";

type Mode = "ver" | "test";

interface TrainerStats {
  /** Aciertos y respuestas por posición. */
  byPosition: Record<string, { seen: number; correct: number }>;
  streak: number;
  bestStreak: number;
}

const EMPTY_STATS: TrainerStats = { byPosition: {}, streak: 0, bestStreak: 0 };

/** Manos ponderadas por combinaciones: así 72o sale el triple que AKs, como en la mesa. */
const WEIGHTED_HANDS: HandCode[] = ALL_HANDS.flatMap((hand) =>
  Array.from({ length: comboCount(hand) / 2 }, () => hand),
);

const randomFrom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/** Dos cartas concretas coherentes con la notación, para enseñarlas en pantalla. */
function cardsForHand(hand: HandCode): Card[] {
  const high = rankIndex(hand[0]);
  const low = rankIndex(hand[1]);
  if (hand.length === 2) return [makeCard(high, 3), makeCard(low, 2)];
  if (hand.endsWith("s")) return [makeCard(high, 3), makeCard(low, 3)];
  return [makeCard(high, 3), makeCard(low, 1)];
}

/** Nombre de la silla tal y como se enseña: con su alias si la mesa es corta. */
const seatLabel = (position: Position, size: TableSize): string =>
  aliasFor(position, size) ?? position;

/** Selector de cuántos jugadores hay sentados. Manda sobre todo lo demás. */
function TableSizePicker({
  size,
  onChange,
}: {
  size: TableSize;
  onChange: (size: TableSize) => void;
}) {
  return (
    <div className="surface rounded-xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">Jugadores en la mesa</p>
        <p className="font-mono text-[10px] text-cream-faint">{TABLE_LABELS[size]}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {TABLE_SIZES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={size === value}
            className={`h-9 w-9 rounded-full font-mono text-[12px] transition-colors ${
              size === value
                ? "bg-brass-500 text-felt-950"
                : "border border-brass-500/20 text-cream-dim hover:border-brass-500/50"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RangeTrainer() {
  const [mode, setMode] = useState<Mode>("ver");
  const [tableSize, setTableSize] = useState<TableSize>(9);
  const [position, setPosition] = useState<Position>("BTN");
  const [kind, setKind] = useState<RangeKind>("open");
  const [selected, setSelected] = useState<HandCode | null>(null);

  const seats = useMemo(() => positionsFor(tableSize), [tableSize]);

  // Si la silla elegida desaparece al reducir la mesa, saltamos al botón.
  useEffect(() => {
    if (!seats.includes(position)) setPosition("BTN");
  }, [seats, position]);

  const info = POSITION_TABLE[position];
  const effectiveKind: RangeKind = position === "BB" ? "threeBet" : kind;

  const gridAction = useCallback(
    (hand: HandCode) => actionFor(position, hand, effectiveKind, tableSize),
    [position, effectiveKind, tableSize],
  );

  const percent = useMemo(
    () =>
      effectiveKind === "threeBet"
        ? percentFor(position, "threeBet", tableSize) + percentFor(position, "call", tableSize)
        : percentFor(position, effectiveKind, tableSize),
    [position, effectiveKind, tableSize],
  );

  const legend: Action[] =
    effectiveKind === "open"
      ? ["raise", "fold"]
      : position === "BB"
        ? ["3bet", "call", "fold"]
        : ["3bet", "fold"];

  const behind = seatsBehind(position, tableSize);

  return (
    <ToolShell
      eyebrow="Herramienta 01"
      title="Entrenador de rangos"
      intro="Las 169 manos posibles, coloreadas según lo que hay que hacer con ellas desde cada posición y con el número de jugadores que tengas en la mesa. Míralas, y cuando te suenen, pasa al modo test."
    >
      <div className="mb-8 inline-flex rounded-full border border-brass-500/20 p-1">
        {(["ver", "test"] as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-full px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              mode === value ? "bg-brass-500 text-felt-950" : "text-cream-faint hover:text-brass-300"
            }`}
          >
            {value === "ver" ? "Ver rangos" : "Modo test"}
          </button>
        ))}
      </div>

      {mode === "ver" ? (
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap gap-1.5">
              {seats.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPosition(value)}
                  className={`rounded px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] transition-colors ${
                    position === value
                      ? "bg-brass-500 text-felt-950"
                      : "border border-brass-500/20 text-cream-dim hover:border-brass-500/50"
                  }`}
                >
                  {seatLabel(value, tableSize)}
                </button>
              ))}
            </div>

            {position !== "BB" && (
              <div className="mb-5 flex gap-2">
                {(["open", "threeBet"] as RangeKind[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setKind(value)}
                    className={`rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                      kind === value
                        ? "bg-brass-500/20 text-brass-200"
                        : "text-cream-faint hover:text-brass-300"
                    }`}
                  >
                    {value === "open" ? "Abrir el bote" : "Resubir (3-bet)"}
                  </button>
                ))}
              </div>
            )}

            <HandGrid actionFor={gridAction} highlight={selected} onSelect={setSelected} />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <GridLegend actions={legend} />
              <p className="font-mono text-[11px] text-cream-faint">
                {percent.toFixed(1)}% de las manos
              </p>
            </div>

            {selected && (
              <p className="mt-4 rounded-lg border border-brass-500/20 bg-felt-850/60 px-4 py-3 font-mono text-[12px] text-cream-dim">
                <span className="text-brass-300">{selected}</span> desde{" "}
                {seatLabel(position, tableSize)} en mesa de {tableSize}:{" "}
                <span className="text-cream">{ACTION_LABEL[gridAction(selected)]}</span> ·{" "}
                {comboCount(selected)} combinaciones
              </p>
            )}
          </div>

          <aside className="space-y-4">
            <TableSizePicker size={tableSize} onChange={setTableSize} />

            <div className="surface rounded-xl p-5">
              <p className="eyebrow">{info.zone}</p>
              <p className="mt-2 font-display text-2xl text-cream">
                {tableSize === 2 && position === "BTN" ? "Botón / ciega pequeña" : info.name}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-cream-dim">
                {tableSize === 2
                  ? position === "BTN"
                    ? "En heads-up el botón pone la ciega pequeña, habla primero preflop y último en todas las demás calles. Por eso abre casi cualquier cosa."
                    : "Solo hay un rival y ya tienes dinero puesto: aquí se defiende muchísimo más que en una mesa llena."
                  : info.idea}
              </p>
              <p className="mt-4 border-t border-brass-500/15 pt-3 font-mono text-[11px] text-brass-300">
                {behind === 0
                  ? "Nadie habla después de ti preflop"
                  : `${behind} ${behind === 1 ? "jugador" : "jugadores"} por detrás`}
              </p>
            </div>

            <div className="surface rounded-xl p-5">
              <p className="eyebrow">
                {effectiveKind === "open" ? "Abres con" : "Resubes con"}
              </p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed break-words text-cream-dim">
                {notationFor(position, effectiveKind, tableSize) ?? "Desde aquí no se abre"}
              </p>
              {effectiveKind === "threeBet" && notationFor(position, "call", tableSize) && (
                <>
                  <p className="eyebrow mt-4">Igualas con</p>
                  <p className="mt-2 font-mono text-[11px] leading-relaxed break-words text-cream-dim">
                    {notationFor(position, "call", tableSize)}
                  </p>
                </>
              )}
            </div>

            <p className="text-xs leading-relaxed text-cream-faint">
              Base: 60bb o más, a partir de la guía de open-raise de PokerStars. Lo que decide el
              rango no es el tamaño de la mesa en sí, sino cuánta gente queda por hablar detrás de
              ti: por eso el primero en hablar en 6-max abre como el lojack de una mesa de 9. No es
              una chuleta cerrada: ajusta según tu stack, el de los rivales y cómo juegan.
            </p>
          </aside>
        </section>
      ) : (
        <TestMode tableSize={tableSize} onTableSize={setTableSize} />
      )}

      {mode === "ver" && (
        <section className="mt-14 min-w-0">
          <h2 className="font-display text-2xl text-cream">
            Mesa de {tableSize}: todas las posiciones
          </h2>
          <div className="mt-5 overflow-x-auto rounded-lg border border-brass-500/15">
            <table className="w-full border-collapse text-left font-mono text-[12px]">
              <thead>
                <tr>
                  {["Posición", "Zona", "Por detrás", "% apertura", "% 3-bet"].map((head) => (
                    <th
                      key={head}
                      className="border-b border-brass-500/25 bg-felt-850/80 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-brass-300"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seats.map((seat) => {
                  const open = percentFor(seat, "open", tableSize);
                  return (
                    <tr key={seat}>
                      <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream">
                        {seatLabel(seat, tableSize)}
                      </td>
                      <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-faint">
                        {POSITION_TABLE[seat].zone}
                      </td>
                      <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-faint">
                        {seatsBehind(seat, tableSize)}
                      </td>
                      <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-dim">
                        {open > 0 ? `${open.toFixed(1)}%` : "—"}
                      </td>
                      <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-dim">
                        {percentFor(seat, "threeBet", tableSize).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </ToolShell>
  );
}

interface Question {
  hand: HandCode;
  position: Position;
  cards: Card[];
}

const newQuestion = (size: TableSize): Question => {
  const hand = randomFrom(WEIGHTED_HANDS);
  const position = randomFrom(openingPositionsFor(size));
  return { hand, position, cards: cardsForHand(hand) };
};

function TestMode({
  tableSize,
  onTableSize,
}: {
  tableSize: TableSize;
  onTableSize: (size: TableSize) => void;
}) {
  const [stats, setStats] = useStoredState<TrainerStats>(STORAGE_KEYS.rangeTrainer, EMPTY_STATS);
  const [question, setQuestion] = useState<Question>(() => newQuestion(tableSize));
  const [answer, setAnswer] = useState<Action | null>(null);

  // Al cambiar de mesa se reparte una mano nueva: la anterior era de otra partida.
  useEffect(() => {
    setQuestion(newQuestion(tableSize));
    setAnswer(null);
  }, [tableSize]);

  const correctAction = actionFor(question.position, question.hand, "open", tableSize);
  const isCorrect = answer !== null && answer === correctAction;
  const openingSeats = openingPositionsFor(tableSize);

  const respond = (choice: Action) => {
    if (answer !== null) return;
    const right = choice === correctAction;
    setAnswer(choice);
    // Las estadísticas se guardan por silla y tamaño de mesa: abrir desde el
    // botón de una mesa de 9 y de una de 3 no es la misma pregunta.
    const key = `${tableSize}max/${question.position}`;
    setStats((current) => {
      const previous = current.byPosition[key] ?? { seen: 0, correct: 0 };
      const streak = right ? current.streak + 1 : 0;
      return {
        byPosition: {
          ...current.byPosition,
          [key]: { seen: previous.seen + 1, correct: previous.correct + (right ? 1 : 0) },
        },
        streak,
        bestStreak: Math.max(current.bestStreak, streak),
      };
    });
  };

  const next = () => {
    setAnswer(null);
    setQuestion(newQuestion(tableSize));
  };

  const totals = Object.values(stats.byPosition).reduce(
    (acc, item) => ({ seen: acc.seen + item.seen, correct: acc.correct + item.correct }),
    { seen: 0, correct: 0 },
  );
  const accuracy = totals.seen === 0 ? 0 : (totals.correct / totals.seen) * 100;

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="surface min-w-0 rounded-2xl p-8 text-center">
        <p className="eyebrow">Mesa de {tableSize} · estás en</p>
        <p className="mt-2 font-display text-4xl text-brass-300">
          {seatLabel(question.position, tableSize)}
        </p>
        <p className="mt-1 text-sm text-cream-faint">
          {seatsBehind(question.position, tableSize)}{" "}
          {seatsBehind(question.position, tableSize) === 1 ? "jugador" : "jugadores"} por detrás ·
          nadie ha subido todavía
        </p>

        <div className="my-8 flex justify-center gap-2">
          {question.cards.map((card, index) => (
            <PlayingCard key={index} card={card} size="lg" />
          ))}
        </div>

        <p className="font-mono text-sm text-cream-dim">{question.hand}</p>

        {answer === null ? (
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => respond("raise")}
              className="rounded-full bg-action-raise px-8 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-felt-950 transition-transform hover:scale-105"
            >
              Subir
            </button>
            <button
              type="button"
              onClick={() => respond("fold")}
              className="rounded-full border border-cream-faint/40 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-cream-dim transition-colors hover:border-cream-dim"
            >
              Tirar
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <p
              className={`font-display text-2xl ${isCorrect ? "text-action-call" : "text-suit-red"}`}
            >
              {isCorrect ? "Correcto" : "Fallaste"}
            </p>
            <p className="mt-2 text-sm text-cream-dim">
              {question.hand} desde {seatLabel(question.position, tableSize)} en mesa de {tableSize}:{" "}
              <span className="text-cream">{ACTION_LABEL[correctAction]}</span>
            </p>
            <button
              type="button"
              onClick={next}
              autoFocus
              className="mt-6 rounded-full bg-brass-500 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-felt-950 transition-colors hover:bg-brass-300"
            >
              Siguiente mano
            </button>
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <TableSizePicker size={tableSize} onChange={onTableSize} />

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Precisión" value={`${accuracy.toFixed(0)}%`} />
          <Stat label="Respuestas" value={`${totals.seen}`} />
          <Stat label="Racha" value={`${stats.streak}`} />
          <Stat label="Mejor racha" value={`${stats.bestStreak}`} />
        </div>

        <div className="surface rounded-xl p-5">
          <p className="eyebrow">Mesa de {tableSize}</p>
          <ul className="mt-3 space-y-1.5">
            {openingSeats.map((seat) => {
              const item = stats.byPosition[`${tableSize}max/${seat}`];
              const rate = item && item.seen > 0 ? (item.correct / item.seen) * 100 : null;
              return (
                <li key={seat} className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="w-16 truncate text-cream-faint">{seat}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-felt-700">
                    <span
                      className="block h-full rounded-full bg-brass-500"
                      style={{ width: `${rate ?? 0}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-cream-dim">
                    {rate === null ? "—" : `${rate.toFixed(0)}%`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs leading-relaxed text-cream-faint">
          Objetivo: 90% en todas las posiciones de las mesas que juegues. Ahí el preflop deja de
          costarte dinero.
        </p>
      </aside>
    </section>
  );
}
