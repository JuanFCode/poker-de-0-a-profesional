import Link from "next/link";
import { ContinueButton } from "@/components/continue-button";
import { GameTool } from "./game-tool";
import { CURRICULUM, TOTAL_LESSONS } from "@/lib/curriculum";

/**
 * La portada es la mesa: se entra y se juega. Debajo, una tira estrecha con la
 * puerta al curso y a las herramientas; el temario entero vive en `/ruta` y el
 * resto está en el menú.
 */

const TOOLS = [
  { href: "/herramientas/mesa", name: "La mesa", line: "Tu silla y el plan", mark: "◎" },
  { href: "/herramientas/rangos", name: "Rangos", line: "Las 169 manos", mark: "♠" },
  { href: "/herramientas/odds", name: "Odds y equity", line: "Pot odds y outs", mark: "♦" },
  { href: "/herramientas/quiz", name: "Quiz", line: "Repaso espaciado", mark: "♣" },
  { href: "/herramientas/bankroll", name: "Bankroll", line: "Sesiones y varianza", mark: "♥" },
];

export default function Home() {
  return (
    <>
      <GameTool />

      <section className="border-t border-brass-500/15 bg-felt-900/40">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <p className="eyebrow">El curso</p>
              <h2 className="mt-2 font-display text-2xl leading-tight text-cream md:text-3xl">
                De las reglas a jugar de forma profesional
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-cream-dim">
                {TOTAL_LESSONS} lecciones en {CURRICULUM.length} fases, en español y gratis. Lo que
                el entrenador te dice en la mesa está explicado entero ahí dentro.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <ContinueButton />
                <Link
                  href="/ruta"
                  className="font-mono text-[11px] tracking-[0.16em] text-cream-faint uppercase underline-offset-4 hover:text-brass-300 hover:underline"
                >
                  Ver el temario
                </Link>
              </div>
            </div>

            <ol className="grid grid-cols-2 gap-x-6 gap-y-3">
              {CURRICULUM.map((module) => (
                <li key={module.slug}>
                  <Link
                    href={`/curso/${module.slug}/${module.lessons[0].slug}`}
                    className="group flex items-baseline gap-2"
                  >
                    <span className="numeral text-brass-500/70">
                      {String(module.index).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] text-cream-dim transition-colors group-hover:text-brass-200">
                      {module.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className="rule-brass mt-10" />

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="surface surface-hover flex h-full flex-col rounded-xl px-4 py-3.5"
                >
                  <span aria-hidden className="font-mono text-sm text-brass-400">
                    {tool.mark}
                  </span>
                  <span className="mt-1.5 font-display text-[15px] text-cream">{tool.name}</span>
                  <span className="mt-0.5 text-xs leading-snug text-cream-faint">{tool.line}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
