# De 0 a profesional · Curso de poker

Web gratuita para aprender Texas Hold'em desde cero hasta jugar con criterio profesional:
reglas claras y cortas, estrategia preflop y postflop, matemáticas de mesa, gestión de bankroll
y cuatro herramientas para practicar. Todo en español y sin backend.

## Qué incluye

**Curso — 28 lecciones en 6 fases**

| Fase | Tema |
| --- | --- |
| 0 | Las reglas: cómo se juega, ranking de manos y desempates, posiciones, errores de principiante |
| 1 | Preflop: posición, rangos de apertura, 3-bet, defensa de ciegas, ajustes |
| 2 | Matemáticas: pot odds, outs, equity contra rangos, EV, frecuencias y MDF |
| 3 | Postflop: texturas, c-bet, turn y river, faroles y blockers, tamaños, una mano comentada |
| 4 | Bankroll y cabeza: gestión, varianza, tilt, rutina de estudio |
| 5 | Profesional: selección de mesa, medir tu juego, GTO vs explotativo, el poker como negocio, plan de 12 semanas |

**Herramientas**

- **Entrenador de rangos** — grid 13×13 por posición (apertura y 3-bet) y modo test con precisión por silla.
- **Odds y equity** — pot odds, outs con la regla del 2 y el 4, y Monte Carlo mano contra mano o contra un rango (en Web Worker).
- **Quiz** — 50 preguntas con repetición espaciada (cajas de Leitner).
- **Tracker de bankroll** — sesiones, curva de resultados, bb/100, €/hora y semáforo de bankroll por formato.

Todo el progreso se guarda en `localStorage`: no hay cuentas, ni servidor, ni datos que salgan del navegador.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · MDX para el contenido · Vitest.
El evaluador de manos, el Monte Carlo y los gráficos están escritos a mano, sin dependencias de runtime.

```
src/
  app/                    páginas (curso, ruta, herramientas)
  components/             UI compartida (grid de manos, cartas, gráfico, callouts)
  content/                las 28 lecciones en .mdx + su registro
  lib/
    poker/                evaluador, equity, odds, rangos, notación (+ tests)
    curriculum.ts         temario: navegación, progreso y rutas estáticas
    quiz.ts  srs.ts  bankroll.ts  storage.ts  progress.ts
public/descargas/         los PDF originales de PokerStars
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 97 tests del motor de poker y la lógica de la app
npm run build    # build de producción
```

## Despliegue

Pensada para Vercel: importa el repositorio en [vercel.com/new](https://vercel.com/new), Next.js se
detecta solo y no hace falta ninguna variable de entorno. Todo el sitio es estático.

## Fuentes

Los rangos preflop parten de la guía de open-raise de PokerStars incluida en `assets/`, ajustados a
los estándares de 9-max de la literatura: *The Grinder's Manual* (Peter Clarke), *Modern Poker Theory*
(Acevedo), *The Theory of Poker* (Sklansky), *Applications of NLHE* (Janda) y *The Mental Game of Poker*
(Tendler).

## Aviso

Contenido educativo. El poker con dinero real implica riesgo económico y puede generar adicción:
juega solo con dinero que puedas permitirte perder y solo si eres mayor de edad.
