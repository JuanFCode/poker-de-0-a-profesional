@AGENTS.md

## Este proyecto

Web gratuita para aprender poker de 0 a profesional, en español, desplegada en Vercel.
Objetivo original: reglas cortas y entendibles, un plan de estudio sacado de libros y experiencia,
la estrategia completa y todo lo necesario para llegar a jugar de forma profesional.

- El temario vive en `src/lib/curriculum.ts`: de ahí salen la navegación, el progreso y las rutas
  estáticas. Al añadir una lección hay que registrarla también en `src/content/registry.ts`.
- Solo frontend: el progreso, el quiz y el bankroll se guardan en `localStorage` (`src/lib/storage.ts`).
- Los rangos preflop y las reglas parten de los PDF de PokerStars en `assets/`.
- Contenido en español; la jerga técnica se deja en inglés (open-raise, 3-bet, c-bet).
- `npm test` cubre el motor de poker (evaluador, equity, odds, rangos) y la coherencia del temario.
