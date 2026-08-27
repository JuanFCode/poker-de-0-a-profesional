import type { ComponentType } from "react";

/**
 * Mapa explícito de lección -> fichero MDX.
 *
 * Se escribe a mano en vez de usar un import dinámico con plantilla para que
 * TypeScript y el bundler sepan exactamente qué ficheros entran en el build.
 * La clave es `modulo/leccion`, igual que `lessonId()` en `lib/curriculum.ts`.
 */
export const LESSON_CONTENT: Record<string, () => Promise<{ default: ComponentType }>> = {
  "reglas/como-se-juega": () => import("./reglas/como-se-juega.mdx"),
  "reglas/ranking-de-manos": () => import("./reglas/ranking-de-manos.mdx"),
  "reglas/la-mesa": () => import("./reglas/la-mesa.mdx"),
  "reglas/errores-de-principiante": () => import("./reglas/errores-de-principiante.mdx"),

  "preflop/la-posicion-manda": () => import("./preflop/la-posicion-manda.mdx"),
  "preflop/rangos-de-apertura": () => import("./preflop/rangos-de-apertura.mdx"),
  "preflop/suited-vs-offsuit": () => import("./preflop/suited-vs-offsuit.mdx"),
  "preflop/cuando-ya-han-subido": () => import("./preflop/cuando-ya-han-subido.mdx"),
  "preflop/limpers-e-isolar": () => import("./preflop/limpers-e-isolar.mdx"),
  "preflop/3-bet": () => import("./preflop/3-bet.mdx"),
  "preflop/squeeze-y-4-bet": () => import("./preflop/squeeze-y-4-bet.mdx"),
  "preflop/defender-las-ciegas": () => import("./preflop/defender-las-ciegas.mdx"),
  "preflop/la-ciega-pequena": () => import("./preflop/la-ciega-pequena.mdx"),
  "preflop/ajustes": () => import("./preflop/ajustes.mdx"),

  "matematicas/pot-odds-y-outs": () => import("./matematicas/pot-odds-y-outs.mdx"),
  "matematicas/equity-y-rangos": () => import("./matematicas/equity-y-rangos.mdx"),
  "matematicas/ev": () => import("./matematicas/ev.mdx"),
  "matematicas/frecuencias": () => import("./matematicas/frecuencias.mdx"),

  "postflop/leer-el-flop": () => import("./postflop/leer-el-flop.mdx"),
  "postflop/c-bet": () => import("./postflop/c-bet.mdx"),
  "postflop/botes-multiway": () => import("./postflop/botes-multiway.mdx"),
  "postflop/turn-y-river": () => import("./postflop/turn-y-river.mdx"),
  "postflop/bluffs-y-blockers": () => import("./postflop/bluffs-y-blockers.mdx"),
  "postflop/tamanos": () => import("./postflop/tamanos.mdx"),
  "postflop/spr-y-compromiso": () => import("./postflop/spr-y-compromiso.mdx"),
  "postflop/mano-comentada": () => import("./postflop/mano-comentada.mdx"),

  "bankroll/gestion-de-bankroll": () => import("./bankroll/gestion-de-bankroll.mdx"),
  "bankroll/varianza": () => import("./bankroll/varianza.mdx"),
  "bankroll/tilt": () => import("./bankroll/tilt.mdx"),
  "bankroll/rutina-de-estudio": () => import("./bankroll/rutina-de-estudio.mdx"),

  "torneo/el-stack-manda": () => import("./torneo/el-stack-manda.mdx"),
  "torneo/icm-y-la-burbuja": () => import("./torneo/icm-y-la-burbuja.mdx"),
  "torneo/bounty-e-hypers": () => import("./torneo/bounty-e-hypers.mdx"),
  "torneo/niveles-y-ante": () => import("./torneo/niveles-y-ante.mdx"),

  "profesional/el-rastrillo": () => import("./profesional/el-rastrillo.mdx"),
  "profesional/seleccion-de-mesa": () => import("./profesional/seleccion-de-mesa.mdx"),
  "profesional/medir-tu-juego": () => import("./profesional/medir-tu-juego.mdx"),
  "profesional/gto-vs-explotativo": () => import("./profesional/gto-vs-explotativo.mdx"),
  "profesional/poker-como-negocio": () => import("./profesional/poker-como-negocio.mdx"),
  "profesional/plan-12-semanas": () => import("./profesional/plan-12-semanas.mdx"),
};
