"use client";

import { useState } from "react";
import { CardPicker } from "@/components/card-picker";
import { PlayingCard } from "@/components/playing-card";
import { prettyCard, type Card } from "@/lib/poker/cards";

/**
 * Elegir tus cartas y el board antes de repartir.
 *
 * Sirve para practicar un sitio concreto —la misma AK en un flop con dos
 * corazones— en vez de esperar a que salga. Lo elegido se queda puesto hasta
 * que lo quites: cada mano nueva vuelven a caer las mismas cartas.
 */

type Slot = "mano" | "board";

const CAPACITY: Record<Slot, number> = { mano: 2, board: 5 };

/** Lo que fija cada carta del board, en orden. */
const BOARD_LABEL = ["flop", "flop", "flop", "turn", "river"] as const;

export function HandSetupPicker({
  cards,
  board,
  onChange,
  open,
  onOpenChange,
  onDealNow,
}: {
  cards: Card[];
  board: Card[];
  onChange: (next: { cards: Card[]; board: Card[] }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, se puede tirar la mano en curso y repartir otra con estas cartas. */
  onDealNow?: () => void;
}) {
  const [slot, setSlot] = useState<Slot>("mano");
  const used = [...cards, ...board];
  const nothingFixed = used.length === 0;

  const pick = (card: Card) => {
    if (used.includes(card)) return;
    const current = slot === "mano" ? cards : board;
    // Con el hueco lleno, la siguiente carta empieza de nuevo.
    const next = current.length >= CAPACITY[slot] ? [card] : [...current, card];
    onChange(slot === "mano" ? { cards: next, board } : { cards, board: next });
    // La mano llena pasa el turno al board: es el orden en el que se piensa.
    if (slot === "mano" && next.length === CAPACITY.mano) setSlot("board");
  };

  const remove = (target: Slot, index: number) => {
    const current = target === "mano" ? cards : board;
    const next = current.filter((_, i) => i !== index);
    onChange(target === "mano" ? { cards: next, board } : { cards, board: next });
  };

  return (
    <div className="mt-5 border-t border-brass-500/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          className="font-mono text-[10px] tracking-[0.16em] text-cream-faint uppercase transition-colors hover:text-brass-300"
        >
          {open ? "Cerrar la baraja" : nothingFixed ? "Elegir las cartas" : "Cambiar las cartas"}
        </button>

        {!nothingFixed && (
          <button
            type="button"
            onClick={() => onChange({ cards: [], board: [] })}
            className="font-mono text-[10px] tracking-[0.14em] text-cream-faint uppercase hover:text-suit-red"
          >
            Todo al azar
          </button>
        )}
      </div>

      {(open || !nothingFixed) && (
        <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3">
          <Row
            label="Tu mano"
            cards={cards}
            capacity={CAPACITY.mano}
            active={open && slot === "mano"}
            onActivate={() => {
              setSlot("mano");
              onOpenChange(true);
            }}
            onRemove={(index) => remove("mano", index)}
          />
          <Row
            label="El board"
            cards={board}
            capacity={CAPACITY.board}
            active={open && slot === "board"}
            onActivate={() => {
              setSlot("board");
              onOpenChange(true);
            }}
            onRemove={(index) => remove("board", index)}
          />
        </div>
      )}

      {open && (
        <div className="mt-4">
          <p className="mb-2 text-xs leading-relaxed text-cream-faint">
            {slot === "mano"
              ? "Elige dos cartas: te las reparten a ti en cada mano."
              : `Las cartas del board salen en orden: las tres primeras son el flop, la cuarta el turn y la quinta el river. Ahora estás poniendo el ${BOARD_LABEL[Math.min(board.length, 4)]}.`}
          </p>
          <CardPicker used={used} onPick={pick} />

          {onDealNow && (
            <button
              type="button"
              onClick={onDealNow}
              className="mt-4 w-full rounded-full border border-brass-500/40 px-5 py-2.5 font-mono text-[11px] tracking-[0.14em] text-brass-200 uppercase transition-colors hover:border-brass-400 hover:bg-brass-500/10"
            >
              Repartir de nuevo con estas cartas
            </button>
          )}
        </div>
      )}

      {!open && !nothingFixed && (
        <p className="mt-2 text-xs leading-relaxed text-cream-faint">
          Estas cartas caen en cada mano; lo que dejes vacío se reparte al azar.
          {onDealNow && " La mano en curso no cambia hasta que repartas otra."}
        </p>
      )}
    </div>
  );
}

/** Los huecos de un grupo, con el que estás llenando marcado. */
function Row({
  label,
  cards,
  capacity,
  active,
  onActivate,
  onRemove,
}: {
  label: string;
  cards: Card[];
  capacity: number;
  active: boolean;
  onActivate: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onActivate}
        className={`font-mono text-[9px] tracking-[0.16em] uppercase transition-colors ${
          active ? "text-brass-300" : "text-cream-faint hover:text-brass-300"
        }`}
      >
        {label}
        {active && <span className="ml-1.5 text-brass-400">●</span>}
      </button>

      <div className="mt-1.5 flex gap-1">
        {Array.from({ length: capacity }, (_, index) => {
          const card = cards[index];
          if (card === undefined) {
            return (
              <button
                key={index}
                type="button"
                onClick={onActivate}
                aria-label={`${label}: hueco vacío`}
                className={`h-12 w-9 rounded-card border border-dashed transition-colors ${
                  active
                    ? "border-brass-400/60 hover:border-brass-400"
                    : "border-brass-500/20 hover:border-brass-500/50"
                }`}
              />
            );
          }
          return (
            <button
              key={`${card}-${index}`}
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Quitar ${prettyCard(card)}`}
              className="transition-transform hover:scale-105"
            >
              <PlayingCard card={card} size="sm" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
