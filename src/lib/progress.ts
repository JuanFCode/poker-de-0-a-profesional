"use client";

import { useCallback, useMemo } from "react";
import { ALL_LESSONS, CURRICULUM, lessonId, TOTAL_LESSONS } from "./curriculum";
import { STORAGE_KEYS, useStoredState } from "./storage";

/** Ids de lección completados, en formato `modulo/leccion`. */
export type ProgressState = string[];

const EMPTY: ProgressState = [];

export function useProgress() {
  const [completed, setCompleted, { hydrated, reset }] = useStoredState<ProgressState>(
    STORAGE_KEYS.progress,
    EMPTY,
  );

  const done = useMemo(() => new Set(completed), [completed]);

  const toggle = useCallback(
    (id: string) => {
      setCompleted((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      );
    },
    [setCompleted],
  );

  const isDone = useCallback((id: string) => done.has(id), [done]);

  const moduleProgress = useCallback(
    (moduleSlug: string) => {
      const module = CURRICULUM.find((m) => m.slug === moduleSlug);
      if (!module) return { done: 0, total: 0 };
      const count = module.lessons.filter((lesson) =>
        done.has(lessonId(moduleSlug, lesson.slug)),
      ).length;
      return { done: count, total: module.lessons.length };
    },
    [done],
  );

  /** Primera lección sin completar: es el destino del botón "continuar". */
  const nextLesson = useMemo(
    () =>
      ALL_LESSONS.find(({ module, lesson }) => !done.has(lessonId(module.slug, lesson.slug))) ??
      null,
    [done],
  );

  return {
    hydrated,
    completedCount: done.size,
    total: TOTAL_LESSONS,
    percent: TOTAL_LESSONS === 0 ? 0 : (done.size / TOTAL_LESSONS) * 100,
    isDone,
    toggle,
    moduleProgress,
    nextLesson,
    reset,
  };
}
