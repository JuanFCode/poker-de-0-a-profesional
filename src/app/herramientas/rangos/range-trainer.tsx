"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ACTION_LABEL, GridLegend, HandGrid } from "@/components/hand-grid";
import { PokerTable } from "@/components/poker-table";
import { TableSizePicker } from "@/components/table-size-picker";
import { Stat, ToolShell } from "@/components/tool-shell";
import { PlayingCard } from "@/components/playing-card";
import { makeCard, rankIndex, type Card } from "@/lib/poker/cards";
import { ALL_HANDS, comboCount, rangePercent, type HandCode } from "@/lib/poker/notation";
import {
  actionFor,
  aliasFor,
  notationFor,
  percentFor,
  POSITION_TABLE,
  positionsFor,
  rangeFor,
  seatsBehind,
  type Action,
  type Position,
  type TableSize,
} from "@/lib/poker/ranges";
import {
  actionVs3Bet,
  actionVs4Bet,
  actionVsOpen,
  defenseFor,
  exploitAddFor,
  loosePercentFor,
  openersAgainst,
  OPEN_SIZE_EFFECT,
  responseTo3Bet,
  responseTo4Bet,
  SIZINGS,
  threeBettorsAgainst,
} from "@/lib/poker/preflop-tree";
import { playbookFor, turnNumber } from "@/lib/poker/table";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";

type Mode = "ver" | "test";

/**
 * Los cuatro pasos del árbol preflop. Casi todo el material que hay por ahí
 * enseña solo el primero, y es en los otros tres donde se pierde el dinero.
 */
type Step = "abro" | "han-subido" | "me-resuben" | "me-4betean";

const STEPS: Step[] = ["abro", "han-subido", "me-resuben", "me-4betean"];

const STEP_LABEL: Record<Step, string> = {
  abro: "Abro yo",
  "han-subido": "Han subido",
  "me-resuben": "Me resuben",
  "me-4betean": "Me 4-betean",
};

const STEP_TITLE: Record<Step, string> = {
  abro: "Nadie ha subido y hablas tú",
  "han-subido": "Alguien ha subido antes que tú",
  "me-resuben": "Abriste y te han resubido",
  "me-4betean": "Resubiste y te han vuelto a subir",
};

const STEP_LEGEND: Record<Step, Action[]> = {
  abro: ["raise", "fold"],
  "han-subido": ["3bet", "call", "fold"],
  "me-resuben": ["4bet", "call", "fold"],
  "me-4betean": ["allin", "call", "fold"],
};

/** Un paso solo existe si en la mesa puede darse esa situación desde esa silla. */
function stepAvailable(step: Step, hero: Position, size: TableSize): boolean {
  switch (step) {
    case "abro":
      return rangeFor(hero, "open", size).size > 0;
    case "han-subido":
    case "me-4betean":
      return openersAgainst(hero, size).length > 0;
    case "me-resuben":
      return threeBettorsAgainst(hero, size).length > 0;
  }
}

interface TrainerStats {
  /** Aciertos y respuestas por escenario y posición. */
  byPosition: Record<string, { seen: number; correct: number }>;
  streak: number;
  bestStreak: number;
}

const EMPTY_STATS: TrainerStats = { byPosition: {}, streak: 0, bestStreak: 0 };

/**
 * La clave con la que se guarda cada estadística.
 * "Abro yo" conserva la clave antigua para no tirar el histórico de nadie.
 */
const statKey = (size: TableSize, step: Step, seat: Position): string =>
  step === "abro" ? `${size}max/${seat}` : `${size}max/${step}/${seat}`;

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

export function RangeTrainer() {
  const [mode, setMode] = useState<Mode>("ver");
  const [tableSize, setTableSize] = useState<TableSize>(9);
  const [seat, setSeat] = useState<Position>("BTN");
  const [requestedStep, setStep] = useState<Step>("abro");
  const [requestedRival, setRival] = useState<Position | null>(null);
  const [showExploit, setShowExploit] = useState(false);
  const [selected, setSelected] = useState<HandCode | null>(null);

  const seats = useMemo(() => positionsFor(tableSize), [tableSize]);

  // Lo que el usuario ha pedido puede dejar de existir al cambiar de mesa o de
  // silla: en vez de corregir el estado con efectos, se resuelve al pintar.
  // Si la silla elegida desaparece al reducir la mesa, se cae al botón.
  const position = seats.includes(seat) ? seat : "BTN";

  // Desde la primera silla nadie ha podido subir antes: ese paso no existe.
  const step = stepAvailable(requestedStep, position, tableSize)
    ? requestedStep
    : (STEPS.find((candidate) => stepAvailable(candidate, position, tableSize)) ?? "abro");

  const rivalOptions = useMemo(() => {
    if (step === "han-subido" || step === "me-4betean") return openersAgainst(position, tableSize);
    if (step === "me-resuben") return threeBettorsAgainst(position, tableSize);
    return [];
  }, [step, position, tableSize]);

  // El rival por defecto es el más cercano a ti: es la situación más frecuente.
  const rival =
    requestedRival && rivalOptions.includes(requestedRival)
      ? requestedRival
      : (rivalOptions[rivalOptions.length - 1] ?? null);

  const info = POSITION_TABLE[position];

  const gridAction = useCallback(
    (hand: HandCode): Action => {
      if (step === "abro") {
        if (rangeFor(position, "open", tableSize).has(hand)) return "raise";
        if (showExploit && exploitAddFor(position).has(hand)) return "extra";
        return "fold";
      }
      if (step === "me-4betean") return actionVs4Bet(position, hand);
      if (!rival) return "fold";
      if (step === "han-subido") return actionVsOpen(position, rival, hand);
      return actionVs3Bet(position, rival, hand);
    },
    [step, position, rival, tableSize, showExploit],
  );

  const percent = useMemo(() => {
    const hands = ALL_HANDS.filter((hand) => {
      const action = gridAction(hand);
      return action !== "fold" && action !== "extra";
    });
    return rangePercent(hands);
  }, [gridAction]);

  const legend: Action[] =
    step === "abro" && showExploit ? ["raise", "extra", "fold"] : STEP_LEGEND[step];

  const behind = seatsBehind(position, tableSize);
  const plan = playbookFor(position, tableSize);

  return (
    <ToolShell
      eyebrow="Herramienta 01"
      title="Entrenador de rangos"
      intro="Las 169 manos posibles, coloreadas según lo que hay que hacer con ellas. Cuatro pasos: abrir el bote, responder a una subida, aguantar una resubida y decidir cuando te vuelven a subir. Míralas, y cuando te suenen, pasa al modo test."
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
            <div className="mb-6">
              <PokerTable
                size={tableSize}
                hero={position}
                raiser={step === "abro" ? null : rival}
                onSelect={setSeat}
                className="max-w-[440px]"
              />
              <p className="mt-2 text-center font-mono text-[10px] text-cream-faint">
                Toca la silla desde la que quieras ver el rango
              </p>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {STEPS.filter((value) => stepAvailable(value, position, tableSize)).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStep(value)}
                  className={`rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    step === value
                      ? "bg-brass-500/20 text-brass-200"
                      : "text-cream-faint hover:text-brass-300"
                  }`}
                >
                  {STEP_LABEL[value]}
                </button>
              ))}
            </div>

            {rivalOptions.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.14em] text-cream-faint uppercase">
                  {step === "me-resuben" ? "Te resube" : "Sube"}
                </span>
                {rivalOptions.map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => setRival(seat)}
                    className={`rounded border px-2.5 py-1 font-mono text-[10px] transition-colors ${
                      rival === seat
                        ? "border-action-3bet bg-action-3bet/20 text-cream"
                        : "border-brass-500/20 text-cream-faint hover:border-brass-400/60 hover:text-brass-300"
                    }`}
                  >
                    {seatLabel(seat, tableSize)}
                  </button>
                ))}
              </div>
            )}

            <HandGrid actionFor={gridAction} highlight={selected} onSelect={setSelected} />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <GridLegend actions={legend} />
              <p className="font-mono text-[11px] text-cream-faint">
                {percent.toFixed(1)}% de las manos
                {step === "abro" && showExploit && (
                  <span className="text-action-extra">
                    {" "}
                    · {loosePercentFor(position).toFixed(1)}% con los añadidos
                  </span>
                )}
              </p>
            </div>

            {selected && (
              <p className="mt-4 rounded-lg border border-brass-500/20 bg-felt-850/60 px-4 py-3 font-mono text-[12px] text-cream-dim">
                <span className="text-brass-300">{selected}</span> desde{" "}
                {seatLabel(position, tableSize)}
                {rival && step !== "abro" ? ` contra ${seatLabel(rival, tableSize)}` : ""}:{" "}
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
                {" · "}
                {`hablas ${turnNumber(position, tableSize)}.º de ${tableSize} en el flop`}
              </p>
            </div>

            <StepCard
              step={step}
              hero={position}
              rival={rival}
              size={tableSize}
              showExploit={showExploit}
              onToggleExploit={() => setShowExploit((value) => !value)}
            />

            <div className="surface rounded-xl p-5">
              <p className="eyebrow">Cómo sacarle provecho</p>
              <p className="mt-2.5 text-sm leading-relaxed text-cream-dim">{plan.edge}</p>
              <p className="mt-3 border-t border-brass-500/15 pt-3 text-sm leading-relaxed text-cream-dim">
                <span className="font-mono text-[10px] tracking-[0.16em] text-brass-300 uppercase">
                  Farol{" "}
                </span>
                {plan.bluff}
              </p>
              <Link
                href="/herramientas/mesa"
                className="mt-4 inline-block font-mono text-[10px] tracking-[0.14em] text-brass-300 uppercase hover:text-brass-200"
              >
                Ver la mesa entera →
              </Link>
            </div>

            <p className="text-xs leading-relaxed text-cream-faint">
              Lo que decide el rango no es el tamaño de la mesa en sí, sino cuánta gente queda por
              hablar detrás de ti: por eso el primero en hablar en 6-max abre como el lojack de una
              mesa de 9. Y ojo al{" "}
              <Link href="/curso/profesional/el-rastrillo" className="text-brass-300 underline">
                rastrillo
              </Link>
              : en una mesa con rake se juega algo más cerrado que en un torneo. No es una chuleta
              cerrada: ajusta según tu stack, el de los rivales y cómo juegan.
            </p>

            <p className="text-xs leading-relaxed text-cream-faint">
              Fuentes: la guía de open-raise de PokerStars en <code>assets/</code> y los charts
              gratuitos de cash en vivo de Jonathan Little (pokercoaching.com/charts).
            </p>
          </aside>
        </section>
      ) : (
        <TestMode key={tableSize} tableSize={tableSize} onTableSize={setTableSize} />
      )}

      {mode === "ver" && (
        <>
          <SizingSection />

          <section className="mt-14 min-w-0">
            <h2 className="font-display text-2xl text-cream">
              Mesa de {tableSize}: todas las posiciones
            </h2>
            <div className="mt-5 overflow-x-auto rounded-lg border border-brass-500/15">
              <table className="w-full border-collapse text-left font-mono text-[12px]">
                <thead>
                  <tr>
                    {[
                      "Posición",
                      "Zona",
                      "Por detrás",
                      "Habla en el flop",
                      "% apertura",
                      "% si la mesa es floja",
                      "% 3-bet",
                      "bb/100 típico",
                    ].map((head) => (
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
                    const suelto = loosePercentFor(seat, tableSize);
                    const winrate = playbookFor(seat, tableSize).winrate;
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
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-faint">
                          {turnNumber(seat, tableSize)}.º
                        </td>
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-dim">
                          {open > 0 ? `${open.toFixed(1)}%` : "—"}
                        </td>
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-faint">
                          {open > 0 && suelto > open ? `${suelto.toFixed(1)}%` : "—"}
                        </td>
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-dim">
                          {percentFor(seat, "threeBet", tableSize).toFixed(1)}%
                        </td>
                        <td
                          className={`border-b border-brass-500/10 px-4 py-2.5 ${
                            winrate > 0 ? "text-action-call" : "text-suit-red"
                          }`}
                        >
                          {winrate > 0 ? "+" : ""}
                          {winrate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </ToolShell>
  );
}

/* ------------------------------------------------------- la ficha del escenario */

/** La notación del paso que estés mirando, con la frase que explica por qué. */
function StepCard({
  step,
  hero,
  rival,
  size,
  showExploit,
  onToggleExploit,
}: {
  step: Step;
  hero: Position;
  rival: Position | null;
  size: TableSize;
  showExploit: boolean;
  onToggleExploit: () => void;
}) {
  const rows: { label: string; notation: string }[] = [];
  let nota: string | null = null;

  if (step === "abro") {
    const open = notationFor(hero, "open", size);
    if (open) rows.push({ label: "Abres con", notation: open });
    nota =
      "Nadie ha metido dinero todavía. Abres subiendo a 3bb (4bb desde la ciega pequeña) o te tiras: en estas mesas no se hace open-limp.";
  } else if (step === "me-4betean") {
    const response = responseTo4Bet(hero);
    rows.push({ label: "Metes el stack con", notation: response.jam });
    rows.push({ label: "Igualas con", notation: response.call });
    nota = response.nota;
  } else if (rival) {
    if (step === "han-subido") {
      const defense = defenseFor(hero, rival);
      if (defense) {
        rows.push({ label: "Resubes con", notation: defense.threeBet });
        rows.push({ label: "Igualas con", notation: defense.call });
        nota = defense.nota;
      }
    } else {
      const response = responseTo3Bet(hero, rival);
      if (response) {
        rows.push({ label: "4-beteas con", notation: response.fourBet });
        rows.push({ label: "Igualas con", notation: response.call });
        nota = response.nota;
      }
    }
  }

  const exploit = step === "abro" ? (exploitAddFor(hero).size > 0 ? hero : null) : null;

  return (
    <div className="surface rounded-xl p-5">
      <p className="eyebrow">{STEP_LABEL[step]}</p>
      <p className="mt-2 text-sm leading-relaxed text-cream">{STEP_TITLE[step]}</p>
      {nota && <p className="mt-2.5 text-sm leading-relaxed text-cream-dim">{nota}</p>}

      {rows.map((row) => (
        <div key={row.label}>
          <p className="eyebrow mt-4">{row.label}</p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed break-words text-cream-dim">
            {row.notation}
          </p>
        </div>
      ))}

      {exploit && (
        <div className="mt-4 border-t border-brass-500/15 pt-4">
          <button
            type="button"
            onClick={onToggleExploit}
            className={`w-full rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              showExploit
                ? "border-action-extra bg-action-extra/25 text-cream"
                : "border-brass-500/25 text-cream-faint hover:border-brass-400/60 hover:text-brass-300"
            }`}
          >
            {showExploit ? "Ocultar añadidos" : "Ver añadidos explotativos"}
          </button>
          {showExploit && (
            <>
              <p className="mt-3 font-mono text-[11px] leading-relaxed break-words text-cream-dim">
                + {[...exploitAddFor(hero)].join(", ")}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-cream-faint">
                Estas manos solo entran si los rivales pagan de más, no resuben lo suficiente y
                juegan mal postflop. Contra una mesa que juega bien se juega{" "}
                <strong className="text-cream-dim">más cerrado</strong>, no más ancho.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- los tamaños */

function SizingSection() {
  return (
    <section className="mt-14 min-w-0">
      <h2 className="font-display text-2xl text-cream">Los tamaños</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-dim">
        Un rango sin tamaño no es una estrategia. Estos son los de una mesa de cash de 100bb: en
        2/5 con ciegas de 5 dólares, subir a 3bb es subir a 15.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {SIZINGS.map((sizing) => (
          <div key={sizing.situacion} className="surface rounded-xl p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-cream">{sizing.situacion}</p>
              <p className="font-mono text-[12px] whitespace-nowrap text-brass-300">
                {sizing.tamano}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-cream-faint">{sizing.porque}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-8 font-display text-lg text-cream">Y si el rival abre más grande</h3>
      <div className="mt-3 overflow-x-auto rounded-lg border border-brass-500/15">
        <table className="w-full border-collapse text-left font-mono text-[12px]">
          <thead>
            <tr>
              {["Abre a", "Tú defiendes"].map((head) => (
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
            {OPEN_SIZE_EFFECT.map((row) => (
              <tr key={row.tamano}>
                <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream">
                  {row.tamano}
                </td>
                <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-dim">
                  {row.defiendes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ modo test */

interface Question {
  step: Step;
  hand: HandCode;
  position: Position;
  rival: Position | null;
  cards: Card[];
}

/** Los pasos que se pueden preguntar, con el peso con el que salen. */
const TEST_STEPS: Step[] = [
  "abro",
  "abro",
  "abro",
  "han-subido",
  "han-subido",
  "han-subido",
  "me-resuben",
];

const newQuestion = (size: TableSize): Question => {
  const seats = positionsFor(size);
  let step = randomFrom(TEST_STEPS);
  let candidates = seats.filter((seat) => stepAvailable(step, seat, size));
  if (candidates.length === 0) {
    step = "abro";
    candidates = seats.filter((seat) => stepAvailable("abro", seat, size));
  }
  const position = randomFrom(candidates);
  const rivals =
    step === "han-subido"
      ? openersAgainst(position, size)
      : step === "me-resuben"
        ? threeBettorsAgainst(position, size)
        : [];
  const hand = randomFrom(WEIGHTED_HANDS);
  return {
    step,
    hand,
    position,
    rival: rivals.length > 0 ? randomFrom(rivals) : null,
    cards: cardsForHand(hand),
  };
};

function answerFor(question: Question, size: TableSize): Action {
  if (question.step === "abro") return actionFor(question.position, question.hand, "open", size);
  if (!question.rival) return "fold";
  if (question.step === "han-subido") {
    return actionVsOpen(question.position, question.rival, question.hand);
  }
  return actionVs3Bet(question.position, question.rival, question.hand);
}

const CHOICES: Record<Step, Action[]> = {
  abro: ["raise", "fold"],
  "han-subido": ["3bet", "call", "fold"],
  "me-resuben": ["4bet", "call", "fold"],
  "me-4betean": ["allin", "call", "fold"],
};

const CHOICE_STYLE: Record<Action, string> = {
  raise: "bg-action-raise text-felt-950",
  "3bet": "bg-action-3bet text-cream",
  "4bet": "bg-action-4bet text-cream",
  allin: "bg-action-allin text-felt-950",
  call: "bg-action-call text-felt-950",
  extra: "bg-action-extra text-cream",
  fold: "border border-cream-faint/40 text-cream-dim hover:border-cream-dim",
};

function TestMode({
  tableSize,
  onTableSize,
}: {
  tableSize: TableSize;
  onTableSize: (size: TableSize) => void;
}) {
  const [stats, setStats] = useStoredState<TrainerStats>(STORAGE_KEYS.rangeTrainer, EMPTY_STATS);
  // Al cambiar de mesa el componente se remonta entero (`key={tableSize}` arriba)
  // y se reparte una mano nueva: la anterior era de otra partida.
  const [question, setQuestion] = useState<Question>(() => newQuestion(tableSize));
  const [answer, setAnswer] = useState<Action | null>(null);

  const correctAction = answerFor(question, tableSize);
  const isCorrect = answer !== null && answer === correctAction;

  const respond = (choice: Action) => {
    if (answer !== null) return;
    const right = choice === correctAction;
    setAnswer(choice);
    // Las estadísticas se guardan por escenario, silla y tamaño de mesa: abrir
    // desde el botón de una mesa de 9 y defender ahí no es la misma pregunta.
    const key = statKey(tableSize, question.step, question.position);
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

  const byStep = STEPS.filter((step) => step !== "me-4betean").map((step) => {
    const item = positionsFor(tableSize).reduce(
      (acc, seat) => {
        const entry = stats.byPosition[statKey(tableSize, step, seat)];
        return entry ? { seen: acc.seen + entry.seen, correct: acc.correct + entry.correct } : acc;
      },
      { seen: 0, correct: 0 },
    );
    return { step, rate: item.seen > 0 ? (item.correct / item.seen) * 100 : null };
  });

  const situacion =
    question.step === "abro"
      ? "nadie ha subido todavía"
      : question.step === "han-subido"
        ? `${seatLabel(question.rival!, tableSize)} sube a 3bb`
        : `abriste a 3bb y ${seatLabel(question.rival!, tableSize)} te resube`;

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="surface min-w-0 rounded-2xl p-8 text-center">
        <p className="eyebrow">Mesa de {tableSize} · estás en</p>
        <p className="mt-2 font-display text-4xl text-brass-300">
          {seatLabel(question.position, tableSize)}
        </p>
        <p className="mt-1 text-sm text-cream-faint">
          {seatsBehind(question.position, tableSize)}{" "}
          {seatsBehind(question.position, tableSize) === 1 ? "jugador" : "jugadores"} por detrás ·{" "}
          {situacion}
        </p>

        <PokerTable
          size={tableSize}
          hero={question.position}
          raiser={question.rival}
          className="mt-6 max-w-[380px]"
        />

        <div className="my-8 flex justify-center gap-2">
          {question.cards.map((card, index) => (
            <PlayingCard key={index} card={card} size="lg" />
          ))}
        </div>

        <p className="font-mono text-sm text-cream-dim">{question.hand}</p>

        {answer === null ? (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {CHOICES[question.step].map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => respond(choice)}
                className={`rounded-full px-7 py-3 font-mono text-[11px] uppercase tracking-[0.16em] transition-transform hover:scale-105 ${CHOICE_STYLE[choice]}`}
              >
                {ACTION_LABEL[choice]}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <p
              className={`font-display text-2xl ${isCorrect ? "text-action-call" : "text-suit-red"}`}
            >
              {isCorrect ? "Correcto" : "Fallaste"}
            </p>
            <p className="mt-2 text-sm text-cream-dim">
              {question.hand} desde {seatLabel(question.position, tableSize)}
              {question.rival ? ` contra ${seatLabel(question.rival, tableSize)}` : ""}:{" "}
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
          <p className="eyebrow">Por escenario</p>
          <ul className="mt-3 space-y-1.5">
            {byStep.map(({ step, rate }) => (
              <li key={step} className="flex items-center gap-3 font-mono text-[11px]">
                <span className="w-24 truncate text-cream-faint">{STEP_LABEL[step]}</span>
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
            ))}
          </ul>
        </div>

        <p className="text-xs leading-relaxed text-cream-faint">
          Objetivo: 90% en los tres escenarios. Ahí el preflop deja de costarte dinero, que es lo
          que se lleva la mayor parte de lo que pierde un jugador de límites bajos.
        </p>
      </aside>
    </section>
  );
}
