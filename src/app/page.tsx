import Link from "next/link";
import { CURRICULUM, TOTAL_LESSONS, TOTAL_MINUTES } from "@/lib/curriculum";
import { PlayingCard } from "@/components/playing-card";
import { parseCards } from "@/lib/poker/cards";
import { ContinueButton } from "@/components/continue-button";

const HERO_CARDS = parseCards("AsKs");

const TOOLS = [
  {
    href: "/juego",
    name: "La mesa jugable",
    line: "Juega manos completas contra rivales que usan los rangos del curso, con un entrenador que explica cada decisión.",
    mark: "▲",
  },
  {
    href: "/herramientas/mesa",
    name: "La mesa y tu silla",
    line: "Mesa interactiva de 2 a 9 jugadores: dónde estás, quién habla después y qué puedes hacer desde ahí.",
    mark: "◎",
  },
  {
    href: "/herramientas/rangos",
    name: "Entrenador de rangos",
    line: "Las 169 manos, posición a posición, y un modo test que mide tu precisión.",
    mark: "♠",
  },
  {
    href: "/herramientas/odds",
    name: "Odds y equity",
    line: "Pot odds, outs y simulación mano contra mano o contra un rango entero.",
    mark: "♦",
  },
  {
    href: "/herramientas/quiz",
    name: "Quiz con repetición",
    line: "Preguntas de reglas, desempates, preflop, postflop y matemáticas. Te repite justo lo que fallas.",
    mark: "♣",
  },
  {
    href: "/herramientas/bankroll",
    name: "Tracker de bankroll",
    line: "Sesiones, curva de resultados, bb/100 y un semáforo que avisa si juegas alto.",
    mark: "♥",
  },
];

export default function Home() {
  const hours = Math.round(TOTAL_MINUTES / 60);

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-16 pb-20 md:grid-cols-[1.25fr_1fr] md:items-center md:pt-24 md:pb-28">
          <div className="animate-rise">
            <p className="eyebrow">Curso gratuito · Texas Hold&apos;em</p>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-[0.95] tracking-[-0.02em] text-cream">
              De cero a jugar
              <br />
              <span className="text-brass-400 italic">como un profesional</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-cream-dim">
              Las reglas en cinco minutos, la estrategia que de verdad mueve el dinero y las
              herramientas para practicarla. Una ruta ordenada de {TOTAL_LESSONS} lecciones, sin
              relleno y sin vender nada.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ContinueButton />
              <Link
                href="/juego"
                className="rounded-full border border-brass-500/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-200 transition-colors hover:border-brass-500/60 hover:bg-brass-500/10"
              >
                Jugar una mano
              </Link>
              <Link
                href="/ruta"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-cream-faint underline-offset-4 transition-colors hover:text-brass-300 hover:underline"
              >
                Ver la ruta completa
              </Link>
            </div>

            <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-brass-500/15 pt-6">
              {[
                { k: `${TOTAL_LESSONS}`, v: "lecciones" },
                { k: `~${hours} h`, v: "de lectura" },
                { k: "6", v: "herramientas" },
                { k: "12", v: "semanas de plan" },
              ].map((item) => (
                <div key={item.v}>
                  <dt className="font-display text-2xl text-brass-300">{item.k}</dt>
                  <dd className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-faint">
                    {item.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Fichas y cartas: el único adorno de la página, y se gana el sitio. */}
          <div className="relative hidden h-80 md:block">
            <div className="absolute top-6 right-10 rotate-[-8deg] animate-rise [animation-delay:120ms]">
              <PlayingCard card={HERO_CARDS[0]} size="lg" />
            </div>
            <div className="absolute top-14 right-32 rotate-[6deg] animate-rise [animation-delay:220ms]">
              <PlayingCard card={HERO_CARDS[1]} size="lg" />
            </div>
            <div className="absolute right-16 bottom-10 flex flex-col items-center gap-1 animate-rise [animation-delay:340ms]">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="block h-3 w-24 rounded-full border border-brass-500/30 bg-gradient-to-r from-felt-700 via-felt-600 to-felt-700 shadow-[0_4px_10px_-6px_rgba(0,0,0,0.9)]"
                />
              ))}
            </div>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full bg-brass-500/5 blur-3xl"
            />
          </div>
        </div>
        <div className="rule-brass mx-auto max-w-6xl" />
      </section>

      {/* --------------------------------------------------------------- fases */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">El camino</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight text-cream">Seis fases</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-cream-faint">
            Cada fase se apoya en la anterior. Puedes saltar, pero el orden está pensado para que
            nunca te falte algo que ya deberías saber.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-brass-500/15 bg-brass-500/10 md:grid-cols-2 lg:grid-cols-3">
          {CURRICULUM.map((module) => (
            <li key={module.slug} className="group bg-felt-900">
              <Link
                href={`/curso/${module.slug}/${module.lessons[0].slug}`}
                className="flex h-full flex-col gap-3 p-7 transition-colors hover:bg-felt-850"
              >
                <div className="flex items-baseline justify-between">
                  <span className="numeral text-5xl">
                    {String(module.index).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint">
                    {module.duration}
                  </span>
                </div>
                <h3 className="font-display text-2xl text-cream transition-colors group-hover:text-brass-200">
                  {module.title}
                </h3>
                <p className="text-sm leading-relaxed text-cream-dim">{module.goal}</p>
                <p className="mt-auto pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-400">
                  {module.lessons.length} lecciones →
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------- herramientas */}
      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="rule-brass" />
        <div className="mt-16">
          <p className="eyebrow">Practicar, no solo leer</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight tracking-tight text-cream">
            Seis herramientas que funcionan en tu navegador
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="surface surface-hover flex items-start gap-5 rounded-xl p-6"
            >
              <span aria-hidden className="font-mono text-2xl leading-none text-brass-400">
                {tool.mark}
              </span>
              <span>
                <span className="block font-display text-xl text-cream">{tool.name}</span>
                <span className="mt-2 block text-sm leading-relaxed text-cream-dim">
                  {tool.line}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------- cierre */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="surface rounded-2xl p-10 md:p-14">
          <p className="eyebrow">Cómo usar esto</p>
          <p className="mt-5 max-w-3xl font-display text-2xl leading-snug text-cream md:text-3xl">
            Lee una lección, practica con la herramienta que enlaza al final y juega manos con esa
            única idea en la cabeza. Repite {TOTAL_LESSONS} veces.
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-cream-faint">
            Tu progreso, tus estadísticas del entrenador y tus sesiones se guardan solo en este
            navegador. No hay cuentas, no hay servidor y no se envía nada a ninguna parte.
          </p>
          <div className="mt-8">
            <ContinueButton />
          </div>
        </div>
      </section>
    </>
  );
}
