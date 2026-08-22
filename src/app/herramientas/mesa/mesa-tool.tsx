"use client";

import { ToolShell } from "@/components/tool-shell";
import { TableExplorer } from "@/components/table-explorer";
import { ADJUSTMENTS, DEPTH_EFFECT } from "@/lib/poker/preflop-tree";

/** Lo que se puede leer en la mesa sin ver una sola carta del rival. */
const READS = [
  {
    title: "Desde qué silla abre",
    body: "Es la lectura más fiable que existe. Un open de UTG es el 9% de las manos: parejas altas, ases fuertes. Un open del botón es el 45%: casi cualquier cosa. La misma apuesta significa cosas distintas según de dónde venga.",
  },
  {
    title: "Cuánta gente queda por hablar",
    body: "Cada rival que falta por decidir es otra oportunidad de que alguien tenga una mano mejor. Por eso el mismo AJo se abre en el botón y se tira en UTG, y por eso los faroles multiway casi nunca funcionan.",
  },
  {
    title: "Quién pasa y quién apuesta el flop",
    body: "El que sube preflop apuesta el flop la mayoría de las veces. Cuando pasa, casi nunca tiene una mano fuerte: ha fallado el flop y te está dejando el bote a un tiro barato.",
  },
  {
    title: "El tamaño de la apuesta",
    body: "Apuestas pequeñas en boards secos (A-7-2 de palos distintos) = rango ancho apostando barato. Apuestas grandes en boards húmedos (J-T-9 del mismo palo) = manos hechas o proyectos fuertes, poco en medio.",
  },
  {
    title: "Lo que hace cuando le subes",
    body: "Igualar un raise y luego pasar es la mano media clásica: la paga, pero no la quiere jugar grande. Ahí es donde vive la mayoría del dinero que se gana faroleando.",
  },
  {
    title: "Frecuencias, no almas",
    body: "No intentes adivinar su mano concreta. Cuenta lo que hace muchas veces: cuántas veces defiende la ciega, cuántas apuesta el flop, cuántas se rinde al turn. Eso sí se puede explotar.",
  },
];

/** Las condiciones que tienen que darse para que un farol gane dinero. */
const BLUFF_RULES = [
  {
    n: "01",
    title: "Pocos rivales",
    body: "Contra uno, tu farol tiene que colar una vez de cada tres. Contra tres, todos tienen que tirar a la vez y eso casi nunca pasa. Farol multiway = fichas regaladas.",
  },
  {
    n: "02",
    title: "Posición",
    body: "Hablar el último te deja ver debilidad antes de invertir. Un farol en posición cuesta menos y acierta más porque solo lo haces cuando ya te han dicho que no tienen nada.",
  },
  {
    n: "03",
    title: "Un board que pega a tu rango",
    body: "Faroleas con la historia, no con tus cartas. Si subiste desde el cutoff, un flop A-K-4 pega a tu rango y no al de quien defendió la ciega: ahí tu apuesta se cree sola. En 7-6-5 la historia no se sostiene.",
  },
  {
    n: "04",
    title: "Un rival que sepa tirar",
    body: "Contra alguien que paga con cualquier pareja no hay farol posible. Con esos se gana apostando fuerte tus manos buenas, que es la otra mitad del juego.",
  },
];

export function MesaTool() {
  return (
    <ToolShell
      eyebrow="Herramienta 05"
      title="La mesa y tu silla"
      intro="Siéntate donde quieras, con los jugadores que quieras, y mira quién habla antes que tú, quién después y qué se puede hacer desde ahí. Es el mapa que hay detrás de todos los rangos: lo que decide tu jugada no es tu mano, es tu sitio."
    >
      <TableExplorer initialSize={9} initialHero="BTN" />

      <section className="mt-16">
        <p className="eyebrow">Sacar información</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-cream">
          Seis cosas que puedes leer sin ver las cartas de nadie
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-cream-dim">
          Información en poker no es adivinar la mano exacta del rival. Es reducir sus manos
          posibles a un grupo más pequeño con lo que ya has visto: desde dónde entró, cuánto
          apostó y qué hizo cuando le subiste.
        </p>

        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-brass-500/15 bg-brass-500/10 md:grid-cols-2">
          {READS.map((item) => (
            <article key={item.title} className="bg-felt-900 p-6">
              <h3 className="font-display text-xl text-cream">{item.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-cream-dim">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <p className="eyebrow">Ajustar</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-cream">
          Lo que ves en la mesa y lo que cambias por ello
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-cream-dim">
          Las tablas son el punto de partida. El dinero está en desviarse por un motivo concreto que
          puedas decir en voz alta. El primer ajuste de la lista es el que casi todo el mundo hace al
          revés.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-brass-500/25">
                <th className="py-2.5 pr-4 font-mono text-[10px] tracking-[0.16em] text-cream-faint uppercase">
                  Lo que ves
                </th>
                <th className="py-2.5 pr-4 font-mono text-[10px] tracking-[0.16em] text-cream-faint uppercase">
                  Lo que cambias
                </th>
                <th className="py-2.5 font-mono text-[10px] tracking-[0.16em] text-cream-faint uppercase">
                  Por qué
                </th>
              </tr>
            </thead>
            <tbody>
              {ADJUSTMENTS.map((entry) => (
                <tr key={entry.lectura} className="border-b border-brass-500/10 align-top">
                  <td className="py-3 pr-4 text-[14px] leading-snug text-cream">{entry.lectura}</td>
                  <td className="py-3 pr-4 text-[14px] leading-snug text-brass-200">
                    {entry.ajuste}
                  </td>
                  <td className="py-3 text-[13px] leading-relaxed text-cream-dim">{entry.porque}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {DEPTH_EFFECT.map((entry) => (
            <article key={entry.profundidad} className="surface rounded-xl p-5">
              <p className="font-mono text-[11px] tracking-[0.14em] text-brass-300 uppercase">
                {entry.profundidad}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-cream-dim">{entry.efecto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <p className="eyebrow">Farolear</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-cream">
          Un farol no es mentir: es apostar cuando la historia cuadra
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-cream-dim">
          Faroleas para que el rival tire manos mejores que la tuya. Eso solo pasa cuando lo que
          cuentas es creíble, y lo creíble depende de tu silla mucho más que de tus dos cartas. Las
          cuatro condiciones se cumplen a la vez o no se farolea.
        </p>

        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {BLUFF_RULES.map((rule) => (
            <li key={rule.n} className="surface flex gap-5 rounded-xl p-6">
              <span className="numeral text-4xl">{rule.n}</span>
              <div>
                <h3 className="font-display text-xl text-cream">{rule.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-cream-dim">{rule.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-8 max-w-2xl text-[14px] leading-relaxed text-cream-faint">
          Regla de bolsillo mientras aprendes: farolea sobre todo cuando estés en posición, contra
          un solo rival y con una mano que todavía puede mejorar (un proyecto de color o de
          escalera). Ese farol gana de dos maneras y es el único que no necesita que aciertes.
        </p>
      </section>
    </ToolShell>
  );
}
