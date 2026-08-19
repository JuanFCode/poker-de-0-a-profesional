import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-brass-500/15 bg-felt-950/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg text-cream">De 0 a profesional</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream-faint">
            Curso gratuito de Texas Hold&apos;em: reglas, estrategia, matemáticas de mesa y
            herramientas para practicar. Todo tu progreso se guarda solo en tu navegador.
          </p>
        </div>

        <div>
          <p className="eyebrow">Curso</p>
          <ul className="mt-3 space-y-2 text-sm text-cream-dim">
            <li>
              <Link href="/ruta" className="hover:text-brass-300">
                La ruta completa
              </Link>
            </li>
            <li>
              <Link href="/curso/reglas/como-se-juega" className="hover:text-brass-300">
                Empezar por las reglas
              </Link>
            </li>
            <li>
              <Link href="/curso/profesional/plan-12-semanas" className="hover:text-brass-300">
                Plan de 12 semanas
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Herramientas</p>
          <ul className="mt-3 space-y-2 text-sm text-cream-dim">
            <li>
              <Link href="/herramientas/mesa" className="hover:text-brass-300">
                La mesa y tu silla
              </Link>
            </li>
            <li>
              <Link href="/herramientas/rangos" className="hover:text-brass-300">
                Entrenador de rangos
              </Link>
            </li>
            <li>
              <Link href="/herramientas/odds" className="hover:text-brass-300">
                Odds y equity
              </Link>
            </li>
            <li>
              <Link href="/herramientas/quiz" className="hover:text-brass-300">
                Quiz de reglas
              </Link>
            </li>
            <li>
              <Link href="/herramientas/bankroll" className="hover:text-brass-300">
                Tracker de bankroll
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brass-500/10">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs leading-relaxed text-cream-faint">
          Contenido educativo. El poker con dinero real implica riesgo económico y puede generar
          adicción: juega solo con dinero que puedas permitirte perder y solo si eres mayor de edad.
          Si crees que el juego es un problema para ti, busca ayuda en{" "}
          <a
            href="https://www.jugarbien.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brass-300 underline underline-offset-2"
          >
            jugarbien.es
          </a>{" "}
          o en el teléfono de atención de tu país.
        </p>
      </div>
    </footer>
  );
}
