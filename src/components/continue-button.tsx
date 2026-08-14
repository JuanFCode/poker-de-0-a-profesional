"use client";

import Link from "next/link";
import { ALL_LESSONS } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";

/**
 * Lleva a la primera lección sin completar. Antes de leer localStorage muestra
 * "Empezar por las reglas", que es lo correcto para quien entra por primera vez.
 */
export function ContinueButton({ className = "" }: { className?: string }) {
  const { hydrated, nextLesson, completedCount } = useProgress();

  const target = hydrated && nextLesson ? nextLesson : ALL_LESSONS[0];
  const started = hydrated && completedCount > 0;
  const finished = hydrated && !nextLesson;

  const label = finished
    ? "Repasar el curso"
    : started
      ? `Continuar · ${target.lesson.title}`
      : "Empezar por las reglas";

  return (
    <Link
      href={finished ? "/ruta" : target.href}
      className={`group inline-flex items-center gap-3 rounded-full bg-brass-500 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-felt-950 transition-all hover:bg-brass-300 ${className}`}
    >
      {label}
      <span aria-hidden className="transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
