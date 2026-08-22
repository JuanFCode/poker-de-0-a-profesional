# De 0 a profesional · Curso de poker

Web gratuita para aprender Texas Hold'em desde cero hasta jugar con criterio profesional:
reglas claras y cortas, estrategia preflop y postflop, matemáticas de mesa, gestión de bankroll
y herramientas para practicar, incluida una mesa jugable. Todo en español y sin backend.

## Qué incluye

**Curso — 35 lecciones en 6 fases**

| Fase | Tema |
| --- | --- |
| 0 | Las reglas: cómo se juega, ranking de manos y desempates, posiciones, errores de principiante |
| 1 | Preflop: posición, rangos de apertura, suited vs offsuit, responder a una subida, limpers e iso-raise, 3-bet, squeeze y 4-bet, defensa de ciegas, ajustes |
| 2 | Matemáticas: pot odds, outs, equity contra rangos, EV, frecuencias y MDF |
| 3 | Postflop: texturas, c-bet, botes multiway, turn y river, faroles y blockers, tamaños, SPR, una mano comentada |
| 4 | Bankroll y cabeza: gestión, varianza, tilt, rutina de estudio |
| 5 | Profesional: el rastrillo, selección de mesa, medir tu juego, GTO vs explotativo, el poker como negocio, plan de 12 semanas |

**Herramientas**

- **La mesa jugable** (`/`, la portada) — manos completas de 2 a 9 jugadores contra rivales que
  juegan con el material del curso: preflop consultan los rangos y el árbol de open / 3-bet / 4-bet,
  y del flop en adelante comparan su equity con las pot odds. Uno de ellos es la *estación* de las
  partidas en vivo: limpea, paga de más y no farolea. El entrenador tiene cuatro pestañas —el plan,
  la tabla del spot en la grid 13×13, los números (equity, pot odds, EV, MDF) y si aquí se farolea o
  no— y al jugar contra el plan clasifica el error, lo suma a *tus fugas* y enlaza la lección.
  La casa cobra rastrillo (10%, tope 4bb, solo si hay flop) y se puede apagar para comparar.
- **Entrenador de rangos** — grid 13×13 por posición con el árbol preflop entero: abrir el bote, responder a
  una subida, aguantar un 3-bet y decidir contra un 4-bet. Incluye los añadidos explotativos como capa aparte
  y un modo test que mide la precisión por escenario.
- **Odds y equity** — pot odds, outs con la regla del 2 y el 4, y Monte Carlo mano contra mano o contra un rango (en Web Worker).
- **Quiz** — preguntas de reglas, preflop, postflop y matemáticas con repetición espaciada (cajas de Leitner).
- **Tracker de bankroll** — sesiones, curva de resultados, bb/100, €/hora y semáforo de bankroll por formato.

Todo el progreso se guarda en `localStorage`: no hay cuentas, ni servidor, ni datos que salgan del navegador.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · MDX para el contenido · Vitest.
El evaluador de manos, el Monte Carlo y los gráficos están escritos a mano, sin dependencias de runtime.

```
src/
  app/                    páginas (curso, ruta, herramientas)
  components/             UI compartida (grid de manos, cartas, gráfico, callouts)
  content/                las 35 lecciones en .mdx + su registro
  lib/
    poker/                evaluador, equity, odds, rangos, notación, motor de juego y bots (+ tests)
    curriculum.ts         temario: navegación, progreso y rutas estáticas
    quiz.ts  srs.ts  bankroll.ts  storage.ts  progress.ts
public/descargas/         los PDF originales de PokerStars
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests del motor de poker, la mesa jugable y la lógica de la app
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

El árbol de defensa (responder a una subida, a un 3-bet y a un 4-bet), los tamaños y la parte de cash en
vivo con rastrillo salen de los charts gratuitos de Jonathan Little en
[pokercoaching.com/charts](https://pokercoaching.com/charts) y de su repaso en vídeo
["The NEW Preflop Strategy I Use to Crush $1/$2 & $2/$5 Cash Games"](https://www.youtube.com/watch?v=R-bqI-pRUmc).

## Aviso

Contenido educativo. El poker con dinero real implica riesgo económico y puede generar adicción:
juega solo con dinero que puedas permitirte perder y solo si eres mayor de edad.
