import type { ReactNode } from "react";

type Tipo = "clave" | "error" | "practica" | "aviso";

const VARIANTS: Record<Tipo, { label: string; mark: string; accent: string }> = {
  clave: { label: "Idea clave", mark: "♠", accent: "var(--color-brass-400)" },
  error: { label: "Error típico", mark: "♥", accent: "var(--color-suit-red)" },
  practica: { label: "Qué practicar", mark: "♣", accent: "var(--color-action-call)" },
  aviso: { label: "Ojo con esto", mark: "♦", accent: "var(--color-cream-dim)" },
};

export function Callout({ tipo = "clave", children }: { tipo?: Tipo; children: ReactNode }) {
  const variant = VARIANTS[tipo] ?? VARIANTS.clave;

  return (
    <aside
      className="not-prose my-8 flex gap-4 rounded-r-lg border-y border-r border-brass-500/12 bg-felt-850/70 p-5"
      style={{ borderLeft: `2px solid ${variant.accent}` }}
    >
      <span aria-hidden className="mt-0.5 font-mono text-lg leading-none" style={{ color: variant.accent }}>
        {variant.mark}
      </span>
      <div>
        <p
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: variant.accent }}
        >
          {variant.label}
        </p>
        <div className="mt-2 text-[15px] leading-relaxed text-cream-dim [&_a]:text-brass-300 [&_a]:underline [&_a]:underline-offset-2 [&_p+p]:mt-3 [&_strong]:text-cream">
          {children}
        </div>
      </div>
    </aside>
  );
}
