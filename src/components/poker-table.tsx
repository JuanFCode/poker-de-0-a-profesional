"use client";

import { aliasFor, POSITION_TABLE, type Position, type TableSize } from "@/lib/poker/ranges";
import { seatLayout } from "@/lib/poker/table";

/** Cada zona tiene su color: de un vistazo se ve dónde empieza a valer la posición. */
const ZONE_STYLE: Record<string, string> = {
  Temprana: "border-felt-600 bg-felt-800 text-cream-faint",
  Media: "border-brass-500/30 bg-felt-800 text-cream-dim",
  Tardía: "border-brass-500/60 bg-brass-500/10 text-brass-200",
  Ciegas: "border-suit-red/45 bg-felt-800 text-cream-dim",
};

export const ZONE_ORDER = ["Temprana", "Media", "Tardía", "Ciegas"] as const;

/** Lo que cada silla pone en el bote antes de repartir, y quién lleva la ficha de dealer. */
function badgeFor(position: Position, size: TableSize): string | null {
  if (position === "BTN") return size === 2 ? "D · ½ bb" : "D";
  if (position === "SB") return "½ bb";
  if (position === "BB") return "1 bb";
  return null;
}

/**
 * La mesa vista desde arriba, contigo siempre sentado abajo en el centro.
 *
 * Es el mismo dibujo de cualquier sala online: así lo que aprendes aquí se
 * reconoce luego en la mesa sin traducir nada. Si le pasas `onSelect`, las
 * sillas son botones y puedes moverte de sitio para ver la mesa desde ahí.
 */
export function PokerTable({
  size,
  hero,
  onSelect,
  className = "",
}: {
  size: TableSize;
  hero: Position;
  onSelect?: (position: Position) => void;
  className?: string;
}) {
  const seats = seatLayout(size, hero);

  return (
    <div
      className={`relative mx-auto aspect-[4/3] w-full max-w-[540px] sm:aspect-[3/2] ${className}`}
    >
      {/* El tapete. */}
      <div className="absolute inset-x-[15%] inset-y-[19%] rounded-[50%] border-2 border-brass-500/25 bg-felt-800/70 shadow-[inset_0_0_50px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-[6px] rounded-[50%] border border-brass-500/10" />
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-cream-faint uppercase">
              Mesa de {size}
            </p>
            <p className="mt-1 font-mono text-[9px] leading-tight text-cream-faint/70">
              el reparto avanza hacia tu izquierda ↻
            </p>
          </div>
        </div>
      </div>

      {seats.map((seat) => {
        const info = POSITION_TABLE[seat.position];
        const label = aliasFor(seat.position, size) ?? seat.position;
        const badge = badgeFor(seat.position, size);
        const Tag = onSelect ? "button" : "div";

        return (
          <Tag
            key={seat.position}
            {...(onSelect
              ? {
                  type: "button" as const,
                  onClick: () => onSelect(seat.position),
                  "aria-pressed": seat.isHero,
                  "aria-label": `${info.name} (${seat.position})`,
                }
              : {})}
            style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
            className={`absolute w-[19%] min-w-[52px] -translate-x-1/2 -translate-y-1/2 rounded-lg border px-1 py-1.5 text-center transition-all ${
              seat.isHero
                ? "z-10 scale-110 border-brass-400 bg-brass-500 text-felt-950 shadow-[0_0_0_3px_rgba(201,162,39,0.18)]"
                : `${ZONE_STYLE[info.zone]} ${onSelect ? "hover:scale-105 hover:border-brass-400/80" : ""}`
            }`}
          >
            {seat.isHero && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-felt-950 px-1.5 font-mono text-[8px] tracking-[0.16em] text-brass-300 uppercase">
                Tú
              </span>
            )}
            <span className="block font-mono text-[10px] leading-tight tracking-tight sm:text-[11px]">
              {label}
            </span>
            {badge && (
              <span
                className={`mt-0.5 block font-mono text-[8px] leading-none ${
                  seat.isHero ? "text-felt-950/70" : "text-cream-faint"
                }`}
              >
                {badge}
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}

/** Leyenda de colores de la mesa. Las zonas son las mismas que usan los rangos. */
export function TableLegend() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {ZONE_ORDER.map((zone) => (
        <li key={zone} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-[3px] border ${ZONE_STYLE[zone]}`} />
          <span className="font-mono text-[10px] tracking-[0.12em] text-cream-faint uppercase">
            {zone}
          </span>
        </li>
      ))}
    </ul>
  );
}
