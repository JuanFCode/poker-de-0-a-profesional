"use client";

import { GRID, type HandCode } from "@/lib/poker/notation";
import type { Action } from "@/lib/poker/ranges";

const ACTION_STYLE: Record<Action, string> = {
  raise: "bg-action-raise/85 text-felt-950",
  "3bet": "bg-action-3bet/85 text-cream",
  call: "bg-action-call/80 text-felt-950",
  fold: "bg-action-fold/60 text-cream-faint",
};

export const ACTION_LABEL: Record<Action, string> = {
  raise: "Subir",
  "3bet": "3-bet",
  call: "Igualar",
  fold: "Tirar",
};

/**
 * La grid 13x13 de siempre: parejas en la diagonal, suited arriba a la derecha
 * y offsuit abajo a la izquierda.
 */
export function HandGrid({
  actionFor,
  highlight,
  onSelect,
}: {
  actionFor: (hand: HandCode) => Action;
  highlight?: HandCode | null;
  onSelect?: (hand: HandCode) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[420px] gap-[2px]"
        style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
        role="table"
        aria-label="Rango de manos preflop"
      >
        {GRID.flatMap((row) =>
          row.map((hand) => {
            const action = actionFor(hand);
            const isHighlight = highlight === hand;
            const Tag = onSelect ? "button" : "div";

            return (
              <Tag
                key={hand}
                {...(onSelect ? { type: "button" as const, onClick: () => onSelect(hand) } : {})}
                title={`${hand} · ${ACTION_LABEL[action]}`}
                className={`aspect-square rounded-[3px] font-mono text-[9px] leading-none tracking-tight transition-transform sm:text-[10px] ${
                  ACTION_STYLE[action]
                } ${onSelect ? "hover:scale-110" : ""} ${
                  isHighlight
                    ? "z-10 scale-110 outline outline-2 outline-offset-1 outline-cream"
                    : ""
                }`}
              >
                <span className="grid h-full w-full place-items-center">{hand}</span>
              </Tag>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function GridLegend({ actions }: { actions: Action[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {actions.map((action) => (
        <li key={action} className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-[2px] ${ACTION_STYLE[action].split(" ")[0]}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream-dim">
            {ACTION_LABEL[action]}
          </span>
        </li>
      ))}
    </ul>
  );
}
