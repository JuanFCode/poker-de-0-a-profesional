"use client";

import { useRouter } from "next/navigation";
import { useProgress } from "@/lib/progress";

/** Marca la lección como terminada y salta a la siguiente. */
export function LessonComplete({ id, nextHref }: { id: string; nextHref: string }) {
  const { hydrated, isDone, toggle } = useProgress();
  const router = useRouter();
  const done = hydrated && isDone(id);

  return (
    <div className="mt-12 flex flex-wrap items-center gap-3 rounded-xl border border-brass-500/15 bg-felt-900/60 p-5">
      <button
        type="button"
        onClick={() => {
          if (!done) {
            toggle(id);
            router.push(nextHref);
          } else {
            toggle(id);
          }
        }}
        className={`inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
          done
            ? "border border-action-call/50 text-action-call hover:border-action-call"
            : "bg-brass-500 text-felt-950 hover:bg-brass-300"
        }`}
      >
        <span aria-hidden>{done ? "✓" : "○"}</span>
        {done ? "Lección terminada" : "Marcar como terminada"}
      </button>
      <p className="text-sm text-cream-faint">
        {done
          ? "Puedes desmarcarla si quieres repasarla más adelante."
          : "Se guarda en este navegador y te lleva a la siguiente."}
      </p>
    </div>
  );
}
