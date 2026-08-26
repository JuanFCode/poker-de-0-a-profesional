"use client";

import { useState } from "react";
import { CardPicker } from "@/components/card-picker";
import { PlayingCard } from "@/components/playing-card";
import { prettyCard, type Card } from "@/lib/poker/cards";

/**
 * Elegir tu propia mano antes de repartir.
 *
 * Sirve para practicar un sitio concreto —la misma AK una y otra vez desde UTG—
 * en vez de esperar a que salga. Las cartas elegidas se quedan puestas hasta que
 * las quites: cada mano nueva te llegan otra vez.
 */
export function HeroHandPicker({
  cards,
  onChange,
}: {
  cards: Card[];
  onChange: (cards: Card[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const complete = cards.length === 2;

  const pick = (card: Card) => {
    if (cards.includes(card)) return;
    // Con las dos puestas, la siguiente carta empieza una mano nueva.
    const next = complete ? [card] : [...cards, card];
    onChange(next);
    if (next.length === 2) setOpen(false);
  };

  return (
    <div className="mt-5 border-t border-brass-500/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="font-mono text-[10px] tracking-[0.16em] text-cream-faint uppercase transition-colors hover:text-brass-300"
        >
          {open ? "Cerrar la baraja" : complete ? "Cambiar mis cartas" : "Elegir mis cartas"}
        </button>

        {complete && (
          <div className="flex items-center gap-1.5">
            {cards.map((card, index) => (
              <button
                key={`${card}-${index}`}
                type="button"
                onClick={() => onChange(cards.filter((_, i) => i !== index))}
                aria-label={`Quitar ${prettyCard(card)}`}
                className="transition-transform hover:scale-105"
              >
                <PlayingCard card={card} size="sm" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => onChange([])}
              className="ml-1 font-mono text-[10px] tracking-[0.14em] text-cream-faint uppercase hover:text-suit-red"
            >
              Al azar
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="mt-3">
          <p className="mb-2 text-xs leading-relaxed text-cream-faint">
            {cards.length === 0
              ? "Elige dos cartas: te las repartirán a ti en cada mano."
              : cards.length === 1
                ? `Elegida ${prettyCard(cards[0])}. Falta la segunda.`
                : "Ya tienes tu mano. Toca otra carta para empezar de nuevo."}
          </p>
          <CardPicker used={cards} onPick={pick} />
        </div>
      )}

      {!open && complete && (
        <p className="mt-2 text-xs leading-relaxed text-cream-faint">
          Cada mano se te reparte {prettyCard(cards[0])} {prettyCard(cards[1])}. El resto de la mesa
          reparte normal.
        </p>
      )}
    </div>
  );
}
