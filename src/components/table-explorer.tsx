"use client";

import Link from "next/link";
import { useState } from "react";
import { PokerTable, TableLegend } from "@/components/poker-table";
import { TableSizePicker } from "@/components/table-size-picker";
import {
  aliasFor,
  percentFor,
  POSITION_TABLE,
  positionsFor,
  seatsBehind,
  type Position,
  type TableSize,
} from "@/lib/poker/ranges";
import { actsAfter, actsBefore, playbookFor, summaryFor, turnNumber } from "@/lib/poker/table";

const ordinal = (value: number): string => `${value}.º`;

/** El nombre largo de la silla, con la excepción del heads-up. */
function seatName(position: Position, size: TableSize): string {
  if (size === 2 && position === "BTN") return "Botón / ciega pequeña";
  return POSITION_TABLE[position].name;
}

function SeatChips({ label, seats, size }: { label: string; seats: Position[]; size: TableSize }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.16em] text-cream-faint uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {seats.length === 0 ? (
          <span className="font-mono text-[11px] text-cream-dim">Nadie</span>
        ) : (
          seats.map((seat) => (
            <span
              key={seat}
              className="rounded border border-brass-500/20 px-2 py-0.5 font-mono text-[10px] text-cream-dim"
            >
              {aliasFor(seat, size) ?? seat}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.16em] text-brass-300 uppercase">{label}</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-cream-dim">{children}</p>
    </div>
  );
}

/**
 * La mesa interactiva: te sientas donde quieras y te cuenta qué significa esa
 * silla — quién habla antes, quién después, cuánta información tienes y qué
 * puedes hacer con ella.
 */
export function TableExplorer({
  initialSize = 9,
  initialHero = "BTN",
  withSizePicker = true,
  withPlaybook = true,
}: {
  initialSize?: TableSize;
  initialHero?: Position;
  withSizePicker?: boolean;
  withPlaybook?: boolean;
}) {
  const [size, setSize] = useState<TableSize>(initialSize);
  const [seat, setSeat] = useState<Position>(initialHero);

  // Al achicar la mesa puede desaparecer tu silla: te sentamos en el botón,
  // que existe en todas. Se calcula al vuelo para no guardar una silla inválida.
  const hero = positionsFor(size).includes(seat) ? seat : "BTN";

  const plan = playbookFor(hero, size);
  const before = actsBefore(hero, size);
  const after = actsAfter(hero, size);
  const open = percentFor(hero, "open", size);

  return (
    <div className="not-prose">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="min-w-0">
          {withSizePicker && (
            <TableSizePicker
              size={size}
              onChange={setSize}
              className="surface mb-5 rounded-xl p-4"
            />
          )}
          <PokerTable size={size} hero={hero} onSelect={setSeat} />
          <div className="mt-3">
            <TableLegend />
          </div>
          <p className="mt-3 text-center font-mono text-[10px] text-cream-faint">
            Toca cualquier silla para sentarte ahí
          </p>
        </div>

        <aside className="surface min-w-0 rounded-xl p-5">
          <p className="eyebrow">{POSITION_TABLE[hero].zone}</p>
          <p className="mt-1.5 font-display text-2xl leading-tight text-cream">
            {seatName(hero, size)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cream-dim">{summaryFor(hero, size)}</p>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-brass-500/15 py-4">
            {[
              { k: "Hablas preflop", v: `${ordinal(turnNumber(hero, size, "preflop"))} de ${size}` },
              { k: "Hablas en el flop", v: `${ordinal(turnNumber(hero, size))} de ${size}` },
              { k: "Por detrás", v: `${seatsBehind(hero, size)}` },
              { k: "Información", v: plan.info },
              { k: "Abres", v: open > 0 ? `${open.toFixed(0)}% de manos` : "No se abre" },
              {
                k: "bb/100 típico",
                v: `${plan.winrate > 0 ? "+" : ""}${plan.winrate}`,
              },
            ].map((item) => (
              <div key={item.k}>
                <dt className="font-mono text-[9px] tracking-[0.16em] text-cream-faint uppercase">
                  {item.k}
                </dt>
                <dd
                  className={`mt-0.5 font-mono text-[13px] ${
                    item.k === "bb/100 típico"
                      ? plan.winrate > 0
                        ? "text-action-call"
                        : "text-suit-red"
                      : "text-cream"
                  }`}
                >
                  {item.v}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 space-y-4">
            <SeatChips label="Hablan antes que tú (flop)" seats={before} size={size} />
            <SeatChips label="Hablan después de ti (flop)" seats={after} size={size} />
          </div>

          <Link
            href="/herramientas/rangos"
            className="mt-5 inline-block font-mono text-[11px] tracking-[0.14em] text-brass-300 uppercase hover:text-brass-200"
          >
            Ver qué manos se abren aquí →
          </Link>
        </aside>
      </div>

      {withPlaybook && (
        <div className="mt-6 grid gap-5 rounded-xl border border-brass-500/15 bg-felt-850/50 p-6 sm:grid-cols-2">
          <Field label="De dónde sale tu dinero">{plan.edge}</Field>
          <Field label="Qué información tienes">{plan.read}</Field>
          <Field label="Cómo se farolea desde aquí">{plan.bluff}</Field>
          <Field label="El error que más cuesta">{plan.trap}</Field>
        </div>
      )}
    </div>
  );
}

/** Versión de solo lectura para ilustrar una mesa concreta dentro de una lección. */
export function TableDiagram({
  size = 9,
  hero = "BTN",
  caption,
}: {
  size?: TableSize;
  hero?: Position;
  caption?: string;
}) {
  return (
    <figure className="not-prose my-8">
      <PokerTable size={size} hero={hero} />
      <div className="mt-3">
        <TableLegend />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-[13px] text-cream-faint">{caption}</figcaption>
      )}
    </figure>
  );
}
