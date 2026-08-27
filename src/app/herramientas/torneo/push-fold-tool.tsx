"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GridLegend, HandGrid } from "@/components/hand-grid";
import { TableSizePicker } from "@/components/table-size-picker";
import { Stat, ToolShell } from "@/components/tool-shell";
import { type HandCode } from "@/lib/poker/notation";
import {
  ADJUSTMENTS,
  callChart,
  reshoveChart,
  rivalZoneOf,
  shoveChart,
  RIVAL_ZONE_LABEL,
  zoneFor,
  type PushFoldChart,
} from "@/lib/poker/pushfold";
import { POSITION_TABLE, positionsFor, type Position, type TableSize } from "@/lib/poker/ranges";

/** Las tres decisiones que existen cuando el stack es corto. */
type Spot = "abro" | "pagar" | "resubir";

const SPOTS: { id: Spot; label: string; title: string }[] = [
  { id: "abro", label: "Abro yo", title: "Nadie ha entrado y hablas tú" },
  { id: "pagar", label: "Me hacen all-in", title: "Alguien ha entrado all-in antes que tú" },
  { id: "resubir", label: "Resubo all-in", title: "Alguien ha subido y tú tienes stack corto" },
];

const STACK_MIN = 3;
const STACK_MAX = 30;

export function PushFoldTool() {
  const [size, setSize] = useState<TableSize>(6);
  const [stack, setStack] = useState(19);
  const [spot, setSpot] = useState<Spot>("abro");
  const [hero, setHero] = useState<Position>("CO");
  const [rival, setRival] = useState<Position>("BTN");
  const [picked, setPicked] = useState<HandCode | null>(null);

  const seats = positionsFor(size);
  // Al cambiar de mesa puede desaparecer la silla elegida.
  const heroSeat = seats.includes(hero) ? hero : seats[seats.length - 3];
  const rivalSeat = seats.includes(rival) ? rival : seats[Math.max(seats.length - 4, 0)];
  const zone = zoneFor(stack);

  const chart: PushFoldChart | null = useMemo(() => {
    if (spot === "abro") return shoveChart(heroSeat, size, stack);
    if (spot === "pagar") return callChart(rivalSeat, size, stack);
    return reshoveChart(rivalSeat, size, stack);
  }, [spot, heroSeat, rivalSeat, size, stack]);

  const verdict = picked && chart ? (chart.hands.has(picked) ? "allin" : "fold") : null;

  return (
    <ToolShell
      eyebrow="Torneo"
      title="Push o fold"
      intro="Con 100 ciegas se juega poker. Con 12 hay una sola decisión: todo dentro o a la basura. Estas son las tablas de EV en fichas para stack corto, ordenadas por la gente que habla detrás de ti, con los ajustes que el torneo añade encima: la recompensa del bounty y los saltos de premio."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* --------------------------------------------------- el stack */}
          <div className="surface rounded-2xl p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="eyebrow">Tu stack efectivo</p>
              <p className="font-display text-3xl leading-none text-brass-200">{stack}bb</p>
            </div>
            <input
              type="range"
              min={STACK_MIN}
              max={STACK_MAX}
              step={1}
              value={stack}
              onChange={(event) => setStack(Number(event.target.value))}
              aria-label="Ciegas grandes que te quedan"
              className="mt-3 w-full accent-brass-500"
            />
            <div className="mt-1 flex justify-between font-mono text-[9px] tracking-[0.14em] text-cream-faint uppercase">
              <span>{STACK_MIN}bb</span>
              <span>{STACK_MAX}bb</span>
            </div>

            <div className="mt-4 rounded-lg border border-brass-500/20 bg-brass-500/[0.06] px-4 py-3">
              <p className="font-mono text-[10px] tracking-[0.16em] text-brass-300 uppercase">
                {zone.headline}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-cream-dim">{zone.detail}</p>
            </div>
          </div>

          {/* -------------------------------------------------- la decisión */}
          <div
            role="tablist"
            aria-label="Qué decisión tienes delante"
            className="mt-6 flex gap-1 rounded-full border border-brass-500/15 p-1"
          >
            {SPOTS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={spot === entry.id}
                onClick={() => setSpot(entry.id)}
                className={`flex-1 rounded-full px-3 py-2 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
                  spot === entry.id
                    ? "bg-brass-500/15 text-brass-200"
                    : "text-cream-faint hover:text-brass-300"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[14px] leading-relaxed text-cream-dim">
            {SPOTS.find((entry) => entry.id === spot)!.title}
            {spot !== "abro" && (
              <>
                {" "}
                desde <span className="text-brass-200">{rivalSeat}</span> (
                {RIVAL_ZONE_LABEL[rivalZoneOf(rivalSeat, size)]}).
              </>
            )}
          </p>

          {/* ------------------------------------------------------- sillas */}
          <div className="mt-4">
            <p className="font-mono text-[9px] tracking-[0.18em] text-cream-faint uppercase">
              {spot === "abro" ? "Tu silla" : "La silla del rival"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {seats
                .filter((seat) => (spot === "abro" ? seat !== "BB" : true))
                .map((seat) => {
                  const active = (spot === "abro" ? heroSeat : rivalSeat) === seat;
                  return (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => (spot === "abro" ? setHero(seat) : setRival(seat))}
                      aria-pressed={active}
                      title={POSITION_TABLE[seat].name}
                      className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                        active
                          ? "border-brass-400 bg-brass-500/15 text-brass-200"
                          : "border-brass-500/20 text-cream-faint hover:border-brass-500/50"
                      }`}
                    >
                      {seat}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* -------------------------------------------------------- tabla */}
          {chart ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-mono text-[10px] tracking-[0.14em] text-cream-dim uppercase">
                  {chart.label}
                </p>
                <p className="font-mono text-[10px] text-cream-faint">
                  tabla de {chart.anchor}bb · {chart.percent.toFixed(1)}% de las manos
                </p>
              </div>

              <div className="mt-3">
                <HandGrid
                  actionFor={(hand) => (chart.hands.has(hand) ? "allin" : "fold")}
                  highlight={picked}
                  onSelect={(hand) => setPicked((current) => (current === hand ? null : hand))}
                />
              </div>
              <div className="mt-4">
                <GridLegend actions={["allin", "fold"]} />
              </div>

              {verdict && picked && (
                <p
                  className={`mt-4 rounded-lg border px-4 py-3 text-[15px] leading-snug ${
                    verdict === "allin"
                      ? "border-action-allin/40 bg-action-allin/10 text-action-allin"
                      : "border-felt-600 bg-felt-900/60 text-cream-faint"
                  }`}
                >
                  <span className="font-display text-xl">{picked}</span> con {stack}bb:{" "}
                  {verdict === "allin"
                    ? spot === "pagar"
                      ? "pagas el all-in."
                      : spot === "resubir"
                        ? "resubes all-in."
                        : "entras all-in."
                    : "se tira."}
                </p>
              )}

              <p className="mt-4 font-mono text-[11px] leading-relaxed break-words text-cream-faint">
                {chart.notation}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-[14px] leading-relaxed text-cream-faint">
              Desde la ciega grande no se abre un bote que ya has ganado: si todos tiran, las
              ciegas son tuyas. Elige otra silla.
            </p>
          )}
        </div>

        {/* ------------------------------------------------------- columna */}
        <aside className="space-y-6">
          <TableSizePicker size={size} onChange={setSize} />

          <div className="grid grid-cols-2 gap-2.5">
            <Stat
              label="Manos"
              value={chart ? `${chart.percent.toFixed(1)}%` : "—"}
              hint="del total de 1326 combinaciones"
            />
            <Stat label="Tramo" value={chart ? `${chart.anchor}bb` : "—"} hint="tabla que se aplica" />
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="eyebrow">Lo que la tabla no sabe</p>
            <ul className="mt-3 space-y-3.5">
              {ADJUSTMENTS.map((entry) => (
                <li key={entry.title} className="border-t border-brass-500/10 pt-3">
                  <p className="text-[14px] leading-snug text-cream">{entry.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-cream-faint">{entry.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-brass-500/20 bg-brass-500/[0.06] p-5">
            <p className="eyebrow">Para estudiar, no para jugar</p>
            <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">
              Las salas prohíben consultar tablas mientras juegas una mano: es asistencia en tiempo
              real y cuesta la cuenta y el saldo. Esto se mira antes de sentarse y al repasar la
              sesión, hasta que las manos salen de memoria.
            </p>
            <Link
              href="/herramientas/rangos"
              className="mt-3 inline-block font-mono text-[11px] text-brass-300 underline-offset-4 hover:underline"
            >
              Memorizarlas en el entrenador →
            </Link>
          </div>
        </aside>
      </div>
    </ToolShell>
  );
}
