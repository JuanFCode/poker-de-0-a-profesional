"use client";

import { PlayingCard } from "@/components/playing-card";
import { RANKS, SUIT_SYMBOLS, makeCard, type Card } from "@/lib/poker/cards";

/** Rejilla con las 52 cartas. Las ya usadas se apagan. */
export function CardPicker({
  used,
  onPick,
  disabled = false,
}: {
  used: Card[];
  onPick: (card: Card) => void;
  disabled?: boolean;
}) {
  const usedSet = new Set(used);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[430px] space-y-1">
        {[3, 2, 1, 0].map((suit) => (
          <div key={suit} className="flex gap-1">
            {RANKS.map((rank, rankIndex) => {
              const card = makeCard(rankIndex, suit);
              const isUsed = usedSet.has(card);
              const red = suit === 1 || suit === 2;

              return (
                <button
                  key={card}
                  type="button"
                  disabled={isUsed || disabled}
                  onClick={() => onPick(card)}
                  aria-label={`${rank}${SUIT_SYMBOLS[suit]}`}
                  className={`flex h-9 flex-1 flex-col items-center justify-center rounded-[3px] border font-mono text-[10px] leading-none transition-all ${
                    isUsed || disabled
                      ? "cursor-not-allowed border-brass-500/10 bg-felt-800/40 text-cream-faint/30"
                      : "border-brass-500/20 bg-cream/95 hover:-translate-y-0.5 hover:border-brass-400"
                  }`}
                  style={
                    isUsed || disabled ? undefined : { color: red ? "#b3231f" : "#12201a" }
                  }
                >
                  <span>{rank}</span>
                  <span className="text-[9px]">{SUIT_SYMBOLS[suit]}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Huecos donde van cayendo las cartas elegidas. */
export function CardSlots({
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
    <div
      className={`rounded-xl border p-4 transition-colors ${
        active ? "border-brass-400 bg-brass-500/5" : "border-brass-500/15"
      }`}
    >
      <button
        type="button"
        onClick={onActivate}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint hover:text-brass-300"
      >
        {label}
        {active && <span className="ml-2 text-brass-400">● eligiendo</span>}
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: capacity }, (_, index) => {
          const card = cards[index];
          if (card === undefined) {
            return (
              <button
                key={index}
                type="button"
                onClick={onActivate}
                aria-label="Hueco vacío"
                className="h-16 w-12 rounded-card border border-dashed border-brass-500/25 transition-colors hover:border-brass-400"
              />
            );
          }
          return (
            <button
              key={index}
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Quitar carta"
              className="transition-transform hover:scale-105"
            >
              <PlayingCard card={card} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
