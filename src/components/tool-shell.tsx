import type { ReactNode } from "react";

/** Cabecera común de las herramientas. */
export function ToolShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <header>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] leading-tight tracking-tight text-cream">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-cream-dim">{intro}</p>
      </header>
      <div className="rule-brass my-9" />
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-action-call"
      : tone === "warn"
        ? "text-brass-300"
        : tone === "bad"
          ? "text-suit-red"
          : "text-cream";

  return (
    <div className="surface rounded-lg px-4 py-3.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream-faint">{label}</p>
      <p className={`mt-1.5 font-display text-2xl leading-none ${color}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-snug text-cream-faint">{hint}</p>}
    </div>
  );
}
