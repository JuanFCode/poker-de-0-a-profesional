"use client";

import Link from "next/link";
import { CURRICULUM, lessonId, TOTAL_MINUTES } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { ContinueButton } from "@/components/continue-button";

export function RutaContent() {
  const { hydrated, completedCount, total, percent, isDone, toggle, moduleProgress, reset } =
    useProgress();

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <header>
        <p className="eyebrow">La ruta</p>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-tight tracking-tight text-cream">
          Seis fases, {total} lecciones
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-cream-dim">
          Marca cada lección cuando la termines. El progreso se guarda en este navegador, sin
          cuenta ni servidor. Unas {Math.round(TOTAL_MINUTES / 60)} horas de lectura, más el tiempo
          que dediques a practicar.
        </p>
      </header>

      {/* Barra de progreso global */}
      <div className="surface mt-10 rounded-xl p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-faint">
              Tu progreso
            </p>
            <p className="mt-1 font-display text-3xl text-cream">
              {hydrated ? completedCount : 0}
              <span className="text-cream-faint"> / {total}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ContinueButton />
            {hydrated && completedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("¿Borrar tu progreso del curso? No se puede deshacer.")) {
                    reset();
                  }
                }}
                className="rounded-full border border-brass-500/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint transition-colors hover:border-suit-red/50 hover:text-suit-red"
              >
                Borrar
              </button>
            )}
          </div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-felt-700">
          <div
            className="h-full rounded-full bg-brass-500 transition-[width] duration-500"
            style={{ width: `${hydrated ? percent : 0}%` }}
          />
        </div>
      </div>

      {/* Fases */}
      <div className="mt-14 space-y-14">
        {CURRICULUM.map((module) => {
          const progress = moduleProgress(module.slug);
          const complete = hydrated && progress.done === progress.total;

          return (
            <section key={module.slug}>
              <div className="flex items-start gap-5">
                <span className="numeral shrink-0 text-6xl">
                  {String(module.index).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="font-display text-3xl tracking-tight text-cream">
                      {module.title}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint">
                      {module.duration}
                    </span>
                    {complete && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-action-call">
                        Completada
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[15px] italic text-brass-300">{module.tagline}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-dim">
                    {module.goal}
                  </p>
                </div>
              </div>

              <ul className="mt-6 divide-y divide-brass-500/10 border-y border-brass-500/10">
                {module.lessons.map((lesson) => {
                  const id = lessonId(module.slug, lesson.slug);
                  const done = hydrated && isDone(id);

                  return (
                    <li key={lesson.slug} className="group flex items-center gap-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        aria-pressed={done}
                        aria-label={done ? `Marcar ${lesson.title} como pendiente` : `Marcar ${lesson.title} como terminada`}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[11px] transition-colors ${
                          done
                            ? "border-action-call bg-action-call/15 text-action-call"
                            : "border-brass-500/30 text-transparent hover:border-brass-400"
                        }`}
                      >
                        ✓
                      </button>

                      <Link href={`/curso/${module.slug}/${lesson.slug}`} className="min-w-0 flex-1">
                        <span
                          className={`block text-[15px] transition-colors ${
                            done ? "text-cream-faint line-through" : "text-cream group-hover:text-brass-200"
                          }`}
                        >
                          {lesson.title}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-cream-faint">
                          {lesson.summary}
                        </span>
                      </Link>

                      <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-cream-faint">
                        {lesson.minutes} min
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
