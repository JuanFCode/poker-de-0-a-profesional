"use client";

import { useState } from "react";

export interface ChartPoint {
  index: number;
  date: string;
  total: number;
}

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 18, right: 18, bottom: 28, left: 52 };

const formatMoney = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`;

/**
 * Curva de resultados acumulados. Una sola serie, así que no lleva leyenda:
 * el título ya dice qué es. Etiqueta directa solo en el último punto.
 */
export function ResultsChart({ points, currency = "€" }: { points: ChartPoint[]; currency?: string }) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="grid h-52 place-items-center rounded-xl border border-dashed border-brass-500/20">
        <p className="text-sm text-cream-faint">Añade sesiones y aquí aparecerá tu curva.</p>
      </div>
    );
  }

  const series = [{ index: 0, date: "", total: 0 }, ...points];
  const totals = series.map((point) => point.total);
  const rawMax = Math.max(...totals, 0);
  const rawMin = Math.min(...totals, 0);
  const span = rawMax - rawMin || 1;
  const max = rawMax + span * 0.12;
  const min = rawMin - span * 0.12;

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (i: number) =>
    PADDING.left + (series.length === 1 ? innerWidth / 2 : (i / (series.length - 1)) * innerWidth);
  const y = (value: number) =>
    PADDING.top + innerHeight - ((value - min) / (max - min)) * innerHeight;

  const line = series.map((point, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(point.total)}`).join(" ");
  const area = `${line} L ${x(series.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`;

  // Puede haber valores repetidos (curva plana), así que la clave va por posición.
  const ticks = [max, (max + min) / 2, min].map((value) => Math.round(value));
  const zeroY = y(0);
  const last = series[series.length - 1];
  const active = hover === null ? null : series[hover];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Resultado acumulado: ${formatMoney(last.total)} ${currency} en ${points.length} sesiones`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          const svgX = ratio * WIDTH;
          const step = innerWidth / Math.max(1, series.length - 1);
          const index = Math.round((svgX - PADDING.left) / step);
          setHover(Math.max(0, Math.min(series.length - 1, index)));
        }}
      >
        <defs>
          <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brass-500)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-brass-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Rejilla discreta */}
        {ticks.map((tick, tickIndex) => (
          <g key={tickIndex}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-brass-500)"
              strokeOpacity="0.1"
            />
            <text
              x={PADDING.left - 10}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[var(--color-cream-faint)] font-mono text-[10px]"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Línea del cero: la referencia que de verdad importa */}
        {min < 0 && max > 0 && (
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--color-cream-faint)"
            strokeOpacity="0.45"
            strokeDasharray="3 3"
          />
        )}

        <path d={area} fill="url(#curve-fill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-brass-400)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Último punto, con etiqueta directa */}
        <circle
          cx={x(series.length - 1)}
          cy={y(last.total)}
          r="4"
          fill="var(--color-brass-300)"
          stroke="var(--color-felt-900)"
          strokeWidth="2"
        />

        {active && (
          <g>
            <line
              x1={x(active.index === 0 && hover === 0 ? 0 : (hover as number))}
              x2={x(hover as number)}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              stroke="var(--color-brass-300)"
              strokeOpacity="0.4"
            />
            <circle
              cx={x(hover as number)}
              cy={y(active.total)}
              r="5"
              fill="var(--color-brass-200)"
              stroke="var(--color-felt-900)"
              strokeWidth="2"
            />
          </g>
        )}

        <text
          x={PADDING.left}
          y={HEIGHT - 8}
          className="fill-[var(--color-cream-faint)] font-mono text-[10px]"
        >
          inicio
        </text>
        <text
          x={WIDTH - PADDING.right}
          y={HEIGHT - 8}
          textAnchor="end"
          className="fill-[var(--color-cream-faint)] font-mono text-[10px]"
        >
          sesión {points.length}
        </text>
      </svg>

      {active && active.date && (
        <div className="pointer-events-none absolute top-2 right-2 rounded-lg border border-brass-500/25 bg-felt-900/95 px-3 py-2 font-mono text-[11px]">
          <p className="text-cream-faint">{active.date}</p>
          <p className="mt-0.5 text-cream">
            {formatMoney(active.total)} {currency}
          </p>
        </div>
      )}
    </div>
  );
}
