"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/ruta", label: "La ruta" },
  { href: "/curso/reglas/como-se-juega", label: "Curso", match: "/curso" },
  { href: "/herramientas/rangos", label: "Rangos", match: "/herramientas/rangos" },
  { href: "/herramientas/odds", label: "Odds", match: "/herramientas/odds" },
  { href: "/herramientas/quiz", label: "Quiz", match: "/herramientas/quiz" },
  { href: "/herramientas/bankroll", label: "Bankroll", match: "/herramientas/bankroll" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (link: (typeof LINKS)[number]) => pathname.startsWith(link.match ?? link.href);

  return (
    <header className="sticky top-0 z-50 border-b border-brass-500/15 bg-felt-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span
            aria-hidden
            className="font-mono text-lg leading-none text-brass-400 transition-transform duration-300 group-hover:-rotate-12"
          >
            ♠
          </span>
          <span className="font-display text-[15px] tracking-wide text-cream">
            De 0 a profesional
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                isActive(link)
                  ? "bg-brass-500/15 text-brass-200"
                  : "text-cream-faint hover:text-brass-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Abrir menú"
          className="rounded border border-brass-500/25 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-300 md:hidden"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-brass-500/15 px-5 pb-4 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block border-b border-brass-500/10 py-3 font-mono text-[12px] uppercase tracking-[0.16em] ${
                isActive(link) ? "text-brass-200" : "text-cream-dim"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
