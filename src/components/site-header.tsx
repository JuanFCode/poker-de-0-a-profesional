"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CURRICULUM } from "@/lib/curriculum";

interface NavLink {
  href: string;
  label: string;
  hint: string;
  /** Prefijo de ruta para marcar el enlace activo, si no vale el href. */
  match?: string;
}

const PRIMARY: NavLink[] = [
  { href: "/", label: "Jugar", hint: "La mesa, con entrenador, rangos y fugas" },
  { href: "/ruta", label: "La ruta", hint: "El temario entero y tu progreso" },
];

const TOOLS: NavLink[] = [
  { href: "/herramientas/mesa", label: "La mesa", hint: "Tu silla y el plan de cada posición" },
  { href: "/herramientas/rangos", label: "Rangos", hint: "Las 169 manos, con modo test" },
  {
    href: "/herramientas/torneo",
    label: "Push o fold",
    hint: "Torneo: all-in, pagar y resubir con stack corto",
  },
  { href: "/herramientas/odds", label: "Odds y equity", hint: "Pot odds, outs y simulador" },
  { href: "/herramientas/quiz", label: "Quiz", hint: "Repaso espaciado de las reglas" },
  { href: "/herramientas/bankroll", label: "Bankroll", hint: "Tracker de sesiones y varianza" },
];

const MODULES: NavLink[] = CURRICULUM.map((module) => ({
  href: `/curso/${module.slug}/${module.lessons[0].slug}`,
  label: module.title,
  hint: `${module.lessons.length} lecciones`,
  match: `/curso/${module.slug}`,
}));

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Con el menú abierto: nada de scroll detrás y Escape lo cierra.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (link: NavLink) => pathname.startsWith(link.match ?? link.href);
  const current =
    [...PRIMARY, ...TOOLS, ...MODULES].find((link) => isActive(link))?.label ?? "Inicio";

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

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-cream-faint sm:block">
            {current}
          </span>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-principal"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="group relative z-50 flex h-10 w-10 items-center justify-center rounded-full border border-brass-500/25 transition-colors hover:border-brass-500/60"
          >
            <span className="sr-only">Menú</span>
            <span aria-hidden className="relative block h-3.5 w-5">
              {[0, 1, 2].map((line) => (
                <span
                  key={line}
                  className={`absolute left-0 block h-px w-full bg-brass-300 transition-all duration-300 ${
                    open
                      ? line === 1
                        ? "top-1/2 opacity-0"
                        : `top-1/2 ${line === 0 ? "rotate-45" : "-rotate-45"}`
                      : line === 0
                        ? "top-0"
                        : line === 1
                          ? "top-1/2"
                          : "top-full"
                  }`}
                />
              ))}
            </span>
          </button>
        </div>
      </div>

      {/* Cortina: cierra el menú al tocar fuera del panel. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 top-[57px] z-40 bg-felt-950/80 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id="menu-principal"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 top-[57px] z-40 max-h-[calc(100dvh-57px)] overflow-y-auto border-b border-brass-500/20 bg-felt-900 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.95)]"
      >
        <nav aria-label="Menú principal" className="mx-auto max-w-6xl px-5 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <Section title="Empezar">
              {PRIMARY.map((link) => (
                <MenuLink
                  key={link.href}
                  link={link}
                  active={isActive(link)}
                  onNavigate={() => setOpen(false)}
                  big
                />
              ))}
            </Section>

            <Section title="Curso">
              {MODULES.map((link) => (
                <MenuLink
                  key={link.href}
                  link={link}
                  active={isActive(link)}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </Section>

            <Section title="Herramientas">
              {TOOLS.map((link) => (
                <MenuLink
                  key={link.href}
                  link={link}
                  active={isActive(link)}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </Section>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-3 space-y-1">{children}</ul>
    </div>
  );
}

function MenuLink({
  link,
  active,
  onNavigate,
  big = false,
}: {
  link: NavLink;
  active: boolean;
  onNavigate: () => void;
  big?: boolean;
}) {
  return (
    <li>
      <Link
        href={link.href}
        onClick={onNavigate}
        className={`block rounded-lg border border-transparent px-3 py-2.5 transition-colors ${
          active
            ? "border-brass-500/30 bg-brass-500/10"
            : "hover:border-brass-500/20 hover:bg-felt-850"
        }`}
      >
        <span
          className={`block ${
            big ? "font-display text-xl text-cream" : "font-body text-[15px] text-cream-dim"
          } ${active ? "text-brass-200" : ""}`}
        >
          {link.label}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-cream-faint">{link.hint}</span>
      </Link>
    </li>
  );
}
