"use client";

/**
 * Persistencia en el navegador. No hay backend: todo lo que guardas se queda
 * en tu equipo, en localStorage. Las claves llevan versión para poder cambiar
 * la forma de los datos sin romper lo que ya había guardado.
 */

import { useCallback, useEffect, useState } from "react";

export const STORAGE_PREFIX = "pokerpro.v1";

export const STORAGE_KEYS = {
  progress: `${STORAGE_PREFIX}.progress`,
  rangeTrainer: `${STORAGE_PREFIX}.rangeTrainer`,
  quiz: `${STORAGE_PREFIX}.quiz`,
  bankroll: `${STORAGE_PREFIX}.bankroll`,
} as const;

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("pokerpro:storage", { detail: key }));
  } catch {
    // Cuota llena o modo privado: seguimos sin persistir en vez de romper la página.
  }
}

export function clearStored(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent("pokerpro:storage", { detail: key }));
}

/**
 * Estado sincronizado con localStorage.
 *
 * Arranca siempre con `fallback` para que el HTML del servidor y el del cliente
 * coincidan, y carga lo guardado en el primer efecto: así no hay hydration mismatch.
 * `hydrated` indica si ya se leyó el valor real.
 */
export function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readStored(key, fallback));
    setHydrated(true);
    // `fallback` se ignora a propósito: solo importa en el primer montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail && detail !== key) return;
      setValue(readStored(key, fallback));
    };
    window.addEventListener("pokerpro:storage", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pokerpro:storage", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof next === "function" ? (next as (c: T) => T)(current) : next;
        writeStored(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    clearStored(key);
    setValue(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, update, { hydrated, reset }] as const;
}

/** Descarga un objeto como fichero JSON (para no perder los datos del tracker). */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
