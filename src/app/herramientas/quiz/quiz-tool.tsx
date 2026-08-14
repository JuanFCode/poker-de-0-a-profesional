"use client";

import { useMemo, useState } from "react";
import { Stat, ToolShell } from "@/components/tool-shell";
import { QUESTIONS, TOPICS, type Question, type Topic } from "@/lib/quiz";
import { applyReview, deckStats, MAX_BOX, nextCardId, type DeckState } from "@/lib/srs";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";

const EMPTY_DECK: DeckState = {};

const QUESTION_BY_ID = new Map(QUESTIONS.map((question) => [question.id, question]));

export function QuizTool() {
  const [deck, setDeck, { hydrated, reset }] = useStoredState<DeckState>(
    STORAGE_KEYS.quiz,
    EMPTY_DECK,
  );
  const [topic, setTopic] = useState<Topic | "Todos">("Todos");
  const [answered, setAnswered] = useState<number | null>(null);
  /** Se incrementa al pasar de pregunta para forzar una nueva selección. */
  const [turn, setTurn] = useState(0);

  const pool = useMemo(
    () =>
      (topic === "Todos" ? QUESTIONS : QUESTIONS.filter((q) => q.topic === topic)).map((q) => q.id),
    [topic],
  );

  const currentId = useMemo(
    () => (hydrated ? nextCardId(deck, pool) : pool[0] ?? null),
    // `turn` entra a propósito: al avanzar hay que volver a elegir pregunta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, pool, hydrated, turn],
  );

  const question: Question | null = currentId ? (QUESTION_BY_ID.get(currentId) ?? null) : null;
  const stats = deckStats(deck, pool);

  const answer = (index: number) => {
    if (answered !== null || !question) return;
    setAnswered(index);
    setDeck((current) => applyReview(current, question.id, index === question.answer));
  };

  const next = () => {
    setAnswered(null);
    setTurn((value) => value + 1);
  };

  return (
    <ToolShell
      eyebrow="Herramienta 03"
      title="Quiz de reglas"
      intro="Cincuenta preguntas sobre lo que hay que saber de memoria. Las que fallas vuelven enseguida; las que aciertas, cada vez más tarde. Así se estudia una tabla."
    >
      <div className="mb-8 flex flex-wrap gap-1.5">
        {(["Todos", ...TOPICS] as (Topic | "Todos")[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTopic(value);
              setAnswered(null);
              setTurn((t) => t + 1);
            }}
            className={`rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              topic === value
                ? "bg-brass-500 text-felt-950"
                : "border border-brass-500/20 text-cream-faint hover:border-brass-500/50 hover:text-brass-300"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          {question ? (
            <div className="surface rounded-2xl p-7 md:p-9">
              <p className="eyebrow">{question.topic}</p>
              <h2 className="mt-4 font-display text-2xl leading-snug text-cream md:text-3xl">
                {question.question}
              </h2>

              <ul className="mt-7 space-y-2.5">
                {question.options.map((option, index) => {
                  const isAnswer = index === question.answer;
                  const isChosen = index === answered;
                  const revealed = answered !== null;

                  return (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => answer(index)}
                        disabled={revealed}
                        className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-[15px] transition-colors ${
                          revealed && isAnswer
                            ? "border-action-call bg-action-call/10 text-cream"
                            : revealed && isChosen
                              ? "border-suit-red bg-suit-red/10 text-cream"
                              : revealed
                                ? "border-brass-500/10 text-cream-faint"
                                : "border-brass-500/20 text-cream-dim hover:border-brass-400 hover:text-cream"
                        }`}
                      >
                        <span className="mt-0.5 font-mono text-[11px] text-brass-400">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {answered !== null && (
                <div className="mt-7 border-t border-brass-500/15 pt-6">
                  <p
                    className={`font-display text-xl ${
                      answered === question.answer ? "text-action-call" : "text-suit-red"
                    }`}
                  >
                    {answered === question.answer ? "Correcto" : "No exactamente"}
                  </p>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-cream-dim">
                    {question.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={next}
                    autoFocus
                    className="mt-6 rounded-full bg-brass-500 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-felt-950 transition-colors hover:bg-brass-300"
                  >
                    Siguiente pregunta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-cream-faint">No hay preguntas para este tema.</p>
          )}
        </div>

        <aside className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Precisión" value={`${(stats.accuracy * 100).toFixed(0)}%`} />
            <Stat label="Vistas" value={`${stats.studied}/${stats.total}`} />
            <Stat label="Dominadas" value={`${stats.mastered}`} hint={`Caja ${MAX_BOX}`} />
            <Stat label="Por repasar" value={`${stats.dueNow}`} />
          </div>

          <div className="surface rounded-xl p-5">
            <p className="eyebrow">Cómo funciona</p>
            <p className="mt-3 text-sm leading-relaxed text-cream-faint">
              Cada pregunta sube de caja cuando la aciertas y vuelve a la primera cuando la fallas.
              Una pregunta dominada tarda tres semanas en volver.
            </p>
          </div>

          {hydrated && stats.studied > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Borrar tu progreso del quiz?")) {
                  reset();
                  setAnswered(null);
                  setTurn((t) => t + 1);
                }
              }}
              className="w-full rounded-full border border-brass-500/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cream-faint transition-colors hover:border-suit-red/50 hover:text-suit-red"
            >
              Borrar progreso
            </button>
          )}
        </aside>
      </div>
    </ToolShell>
  );
}
