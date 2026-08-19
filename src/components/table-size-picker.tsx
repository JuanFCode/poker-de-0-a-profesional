"use client";

import { TABLE_LABELS, TABLE_SIZES, type TableSize } from "@/lib/poker/ranges";

/** Selector de cuántos jugadores hay sentados. Manda sobre todo lo demás. */
export function TableSizePicker({
  size,
  onChange,
  className = "surface rounded-xl p-5",
}: {
  size: TableSize;
  onChange: (size: TableSize) => void;
  className?: string;
}) {
  return (
    <div className={className}>
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
