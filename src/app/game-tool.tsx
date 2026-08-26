"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GridLegend, HandGrid } from "@/components/hand-grid";
import { HandSetupPicker } from "@/components/hand-setup-picker";
import { LiveTable } from "@/components/live-table";
import { PlayingCard } from "@/components/playing-card";
import { Stat } from "@/components/tool-shell";
import { botMove } from "@/lib/poker/bot";
import { type Card } from "@/lib/poker/cards";
import { advise, bluffRead, matchesAdvice, spotRange, type Advice } from "@/lib/poker/coach";
import {
  abandonHand,
  applyAction,
  BIG_BLIND,
  createGame,
  EMPTY_STATS,
  formatBB,
  isHeroTurn,
  legalMoves,
  normalizeStats,
  RAKE,
  revealedSeats,
  startHand,
  STREET_LABEL,
  type GameAction,
  type GameState,
  type SessionStats,
} from "@/lib/poker/game";
import { classifyLeak, topLeaks, type Leak, type LeakCounts } from "@/lib/poker/leaks";
import { handCodeOf } from "@/lib/poker/notation";
import { TABLE_LABELS, TABLE_SIZES, type TableSize } from "@/lib/poker/ranges";
import { tipFor } from "@/lib/poker/tips";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";

/** Milisegundos que tarda cada rival en decidir: lo justo para poder seguirlo. */
const BOT_DELAY = 700;

/** Paso del deslizador de subida: media ciega grande. */
const SMALL_STEP = BIG_BLIND / 2;

/** Semilla nueva para cada mesa. Fuera del componente: el render es puro. */
const randomSeed = (): number => (Math.random() * 0x7fffffff) | 0;

type Tab = "plan" | "rango" | "numeros" | "farol";

const TABS: { id: Tab; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "rango", label: "Rango" },
  { id: "numeros", label: "Números" },
  { id: "farol", label: "Farol" },
];

interface Feedback {
  ok: boolean;
  headline: string;
  detail: string;
  leak: Leak | null;
}

export function GameTool() {
  const [storedStats, setStats] = useStoredState<SessionStats>(STORAGE_KEYS.game, EMPTY_STATS);
  const [leaks, setLeaks] = useStoredState<LeakCounts>(STORAGE_KEYS.leaks, {});
  const stats = normalizeStats(storedStats);
  const [size, setSize] = useState<TableSize>(6);
  const [rake, setRake] = useState(true);
  // Semilla fija en el primer render para que el HTML del servidor y el del
  // cliente coincidan; al repartir se cambia por una de verdad.
  const [state, setState] = useState<GameState>(() => createGame({ size: 6 }));
  const [tab, setTab] = useState<Tab>("plan");
  const [coachOn, setCoachOn] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [botNote, setBotNote] = useState<string | null>(null);
  /** Lo que has movido tú el deslizador; si no lo tocas manda la sugerencia. */
  const [raiseOverride, setRaiseOverride] = useState<number | null>(null);
  /** Cartas que te eliges tú y board fijado; vacío = reparto al azar. */
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [myBoard, setMyBoard] = useState<Card[]>([]);
  /** La baraja abierta: se abre también tocando tus cartas del cabecero. */
  const [setupOpen, setSetupOpen] = useState(false);

  const heroTurn = isHeroTurn(state) && state.result === null;
  const legal = heroTurn ? legalMoves(state, state.heroSeat) : null;
  const hero = state.players[state.heroSeat];
  const heroHand = hero.cards.length === 2 ? handCodeOf(hero.cards[0], hero.cards[1]) : null;

  // El plan del entrenador para la decisión que tienes delante.
  const advice: Advice | null = useMemo(
    () => (heroTurn && hero.cards.length === 2 ? advise(state, state.heroSeat) : null),
    [state, heroTurn, hero.cards.length],
  );
  // Las tablas y la cuenta del farol solo se calculan si estás mirando su pestaña.
  const grid = useMemo(
    () => (heroTurn && tab === "rango" ? spotRange(state, state.heroSeat) : null),
    [state, heroTurn, tab],
  );
  const bluff = useMemo(
    () => (heroTurn && tab === "farol" ? bluffRead(state, state.heroSeat) : null),
    [state, heroTurn, tab],
  );
  const tip = useMemo(
    () => (state.handNumber > 0 ? tipFor(state, state.heroSeat) : null),
    [state],
  );

  // Los rivales van hablando solos.
  useEffect(() => {
    if (state.result || state.toAct === null || state.toAct === state.heroSeat) return;
    const seat = state.toAct;
    const timer = setTimeout(() => {
      const move = botMove(state, seat, Math.random);
      setBotNote(`${state.players[seat].name}: ${move.reason}`);
      // Solo se aplica si nadie ha tocado la mesa mientras el rival "pensaba".
      setState((current) => (current === state ? applyAction(current, move.action) : current));
    }, BOT_DELAY);
    return () => clearTimeout(timer);
  }, [state]);

  // La sesión se guarda en el navegador al cerrar cada mano.
  useEffect(() => {
    if (state.result) setStats(state.stats);
    // `setStats` es estable; solo interesa el cierre de mano.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.result]);

  // La subida arranca en dos tercios del bote y se recorta a lo que permite tu stack.
  const raiseTo = legal
    ? Math.max(
        legal.minRaiseTo,
        Math.min(
          raiseOverride ?? state.currentBet + Math.round(0.66 * legal.potNow),
          legal.maxRaiseTo,
        ),
      )
    : 0;

  const fresh = (options: { size?: TableSize; rake?: boolean } = {}) =>
    createGame({
      size: options.size ?? size,
      rake: options.rake ?? rake,
      seed: randomSeed(),
      stats,
    });

  const deal = () => {
    setFeedback(null);
    setBotNote(null);
    setRaiseOverride(null);
    // Si hay mano en curso se deja a medias y se devuelve lo apostado: no hay
    // ganador, así que esa mano no cuenta para la sesión.
    const base =
      state.handNumber === 0 || state.size !== size || state.rake !== rake
        ? fresh()
        : abandonHand(state);
    setState(startHand(base, { heroCards: myCards, board: myBoard }));
  };

  const restart = (options: { size?: TableSize; rake?: boolean }) => {
    if (options.size !== undefined) setSize(options.size);
    if (options.rake !== undefined) setRake(options.rake);
    setFeedback(null);
    setBotNote(null);
    setRaiseOverride(null);
    setState(fresh(options));
  };

  const act = (action: GameAction) => {
    if (!heroTurn) return;
    setRaiseOverride(null);
    if (advice) {
      const ok = matchesAdvice(advice, action);
      const leak = ok ? null : classifyLeak(state, state.heroSeat, advice, action);
      if (leak) setLeaks((current) => ({ ...current, [leak.id]: (current[leak.id] ?? 0) + 1 }));
      setFeedback({ ok, headline: advice.headline, detail: advice.detail, leak });
    }
    setState((current) => applyAction(current, action));
  };

  const revealed = revealedSeats(state);
  const handLog = state.log.filter((entry) => entry.hand === state.handNumber).slice(-9);
  const netBB = stats.net / BIG_BLIND;
  const misFugas = topLeaks(leaks);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">La mesa</p>
          <h1 className="mt-1 font-display text-3xl leading-tight text-cream md:text-4xl">
            Juega una mano de verdad
          </h1>
        </div>
        <p className="max-w-md text-[13px] leading-relaxed text-cream-faint">
          Rivales que no improvisan: preflop consultan los rangos del curso y del flop en adelante
          calculan equity y pot odds. Antes de cada decisión tuya, el entrenador te dice qué dice el
          plan, con qué rango, con qué números y si aquí se farolea o no.
        </p>
      </div>
      <div className="rule-brass mt-5" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <LiveTable state={state} revealed={revealed} />

          {/* ------------------------------------------------------ tu turno */}
          <div className="surface mt-6 rounded-2xl p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">
                {state.handNumber === 0
                  ? "Mesa vacía"
                  : `Mano ${state.handNumber} · ${STREET_LABEL[state.street]}`}
              </p>
              {hero.cards.length === 2 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSetupOpen((value) => !value)}
                    aria-expanded={setupOpen}
                    title="Elegir tus cartas y el board"
                    className="flex items-center gap-1.5 rounded-lg p-1 transition-transform hover:scale-105"
                  >
                    {hero.cards.map((card, index) => (
                      <PlayingCard key={`${card}-${index}`} card={card} size="sm" />
                    ))}
                  </button>
                  <span className="font-mono text-[10px] text-cream-faint">
                    {hero.position} · {formatBB(hero.stack)}
                  </span>
                </div>
              )}
            </div>

            {state.handNumber === 0 && (
              <button
                type="button"
                onClick={deal}
                className="mt-5 w-full rounded-full bg-brass-500 px-6 py-3 font-mono text-[12px] tracking-[0.16em] text-felt-950 uppercase transition-colors hover:bg-brass-400"
              >
                Repartir la primera mano
              </button>
            )}

            {state.result && (
              <div className="mt-5">
                <p className="font-display text-xl leading-snug text-cream">
                  {state.result.summary}
                </p>
                <p
                  className={`mt-1 font-mono text-[12px] ${
                    state.result.heroDelta >= 0 ? "text-action-call" : "text-suit-red"
                  }`}
                >
                  {state.result.heroDelta >= 0 ? "+" : "−"}
                  {formatBB(Math.abs(state.result.heroDelta))} en esta mano
                </p>

                {state.result.showdown && (
                  <ul className="mt-4 space-y-1.5">
                    {state.result.ranked.map((entry) => (
                      <li key={entry.seat} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 truncate font-mono text-[11px] text-cream-dim">
                          {state.players[entry.seat].name}
                        </span>
                        <span className="flex gap-0.5">
                          {entry.five.map((card, index) => (
                            <PlayingCard key={`${card}-${index}`} card={card} size="sm" />
                          ))}
                        </span>
                        <span className="font-mono text-[11px] text-brass-300">{entry.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={deal}
                  className="mt-5 w-full rounded-full bg-brass-500 px-6 py-3 font-mono text-[12px] tracking-[0.16em] text-felt-950 uppercase transition-colors hover:bg-brass-400"
                >
                  Siguiente mano
                </button>
              </div>
            )}

            {legal && (
              <div className="mt-5">
                <div className="flex flex-wrap gap-2">
                  {legal.canFold && (
                    <ActionButton onClick={() => act({ type: "fold" })} tone="fold">
                      Tirar
                    </ActionButton>
                  )}
                  {legal.canCheck && (
                    <ActionButton onClick={() => act({ type: "check" })}>Pasar</ActionButton>
                  )}
                  {legal.canCall && (
                    <ActionButton onClick={() => act({ type: "call" })} tone="call">
                      Pagar {formatBB(legal.callAmount)}
                    </ActionButton>
                  )}
                  {legal.canRaise && (
                    <ActionButton onClick={() => act({ type: "raise", to: raiseTo })} tone="raise">
                      {state.currentBet === 0 ? "Apostar" : "Subir a"} {formatBB(raiseTo)}
                    </ActionButton>
                  )}
                </div>

                {legal.canRaise && !legal.raiseIsAllIn && (
                  <div className="mt-4">
                    <input
                      type="range"
                      min={legal.minRaiseTo}
                      max={legal.maxRaiseTo}
                      step={SMALL_STEP}
                      value={raiseTo}
                      onChange={(event) => setRaiseOverride(Number(event.target.value))}
                      aria-label="Tamaño de la subida"
                      className="w-full accent-brass-500"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        { label: "½ bote", fraction: 0.5 },
                        { label: "⅔ bote", fraction: 0.66 },
                        { label: "Bote", fraction: 1 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setRaiseOverride(
                              state.currentBet + Math.round(preset.fraction * legal.potNow),
                            )
                          }
                          className="rounded-full border border-brass-500/20 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-cream-faint uppercase transition-colors hover:border-brass-500/50 hover:text-brass-300"
                        >
                          {preset.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setRaiseOverride(legal.maxRaiseTo)}
                        className="rounded-full border border-action-allin/40 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-action-allin uppercase transition-colors hover:border-action-allin"
                      >
                        All-in
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!legal && !state.result && state.handNumber > 0 && (
              <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-cream-faint uppercase">
                Hablan los rivales…
              </p>
            )}

            <HandSetupPicker
              cards={myCards}
              board={myBoard}
              onChange={(next) => {
                setMyCards(next.cards);
                setMyBoard(next.board);
              }}
              open={setupOpen}
              onOpenChange={setSetupOpen}
              // Con una mano en curso hay que repartir otra para verlas caer.
              onDealNow={state.handNumber > 0 && state.result === null ? deal : undefined}
            />

            {botNote && (
              <p className="mt-4 border-t border-brass-500/10 pt-3 text-[13px] leading-relaxed text-cream-faint">
                {botNote}
              </p>
            )}
          </div>

          {/* -------------------------------------------------- registro */}
          {handLog.length > 0 && (
            <div className="mt-6">
              <p className="eyebrow">La mano, paso a paso</p>
              <ul className="mt-3 space-y-1">
                {handLog.map((entry, index) => (
                  <li
                    key={`${entry.text}-${index}`}
                    className={`font-mono text-[11px] leading-relaxed ${
                      entry.kind === "street"
                        ? "text-brass-300"
                        : entry.kind === "result"
                          ? "text-cream"
                          : "text-cream-faint"
                    }`}
                  >
                    {entry.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------ columna */}
        <aside className="space-y-6">
          <div className="surface rounded-2xl p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow">El entrenador</p>
              <button
                type="button"
                onClick={() => setCoachOn((value) => !value)}
                aria-pressed={coachOn}
                className="font-mono text-[10px] tracking-[0.14em] text-cream-faint uppercase hover:text-brass-300"
              >
                {coachOn ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {coachOn && (
              <div
                role="tablist"
                aria-label="Qué te enseña el entrenador"
                className="mt-4 flex gap-1 rounded-full border border-brass-500/15 p-1"
              >
                {TABS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === entry.id}
                    onClick={() => setTab(entry.id)}
                    className={`flex-1 rounded-full px-2 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
                      tab === entry.id
                        ? "bg-brass-500/15 text-brass-200"
                        : "text-cream-faint hover:text-brass-300"
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            )}

            {!coachOn && (
              <p className="mt-3 text-[14px] leading-relaxed text-cream-faint">
                Entrenador oculto: juega a ciegas y compara al final de la mano.
              </p>
            )}

            {coachOn && !advice && (
              <p className="mt-4 text-[14px] leading-relaxed text-cream-faint">
                Cuando te toque hablar aparece aquí el plan: de qué rango sale la decisión, qué
                equity tienes, qué precio te están poniendo y si este es sitio para farolear.
              </p>
            )}

            {coachOn && advice && tab === "plan" && (
              <div className="mt-4">
                <p className="font-display text-2xl leading-tight text-brass-200">
                  {advice.headline}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-cream-faint uppercase">
                  {advice.source}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-cream-dim">{advice.detail}</p>
              </div>
            )}

            {coachOn && advice && tab === "numeros" && (
              <ul className="mt-4 space-y-2.5">
                {advice.numbers.map((entry) => (
                  <li key={entry.label} className="border-t border-brass-500/10 pt-2.5">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-cream-faint uppercase">
                      {entry.label}
                    </p>
                    <p className="mt-0.5 font-mono text-[13px] break-words text-cream">
                      {entry.value}
                    </p>
                    {entry.hint && (
                      <p className="mt-0.5 text-xs leading-snug text-cream-faint">{entry.hint}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {coachOn && advice && tab === "rango" && (
              <div className="mt-4">
                {grid ? (
                  <>
                    <p className="font-mono text-[10px] tracking-[0.12em] text-cream-faint uppercase">
                      {grid.label}
                    </p>
                    <div className="mt-3">
                      <HandGrid actionFor={grid.actionFor} highlight={heroHand} />
                    </div>
                    <GridLegend actions={grid.legend} />
                    {grid.notation && (
                      <p className="mt-3 font-mono text-[11px] leading-relaxed break-words text-cream-faint">
                        {grid.notation}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[14px] leading-relaxed text-cream-faint">
                    Del flop en adelante no hay tabla que valga: la decisión sale de tu equity
                    contra los que siguen y del precio que te ponen. Míralo en Números.
                  </p>
                )}
              </div>
            )}

            {coachOn && advice && tab === "farol" && bluff && (
              <div className="mt-4">
                <p
                  className={`font-display text-2xl leading-tight ${
                    bluff.verdict === "farol"
                      ? "text-action-raise"
                      : bluff.verdict === "valor"
                        ? "text-action-call"
                        : "text-cream-dim"
                  }`}
                >
                  {bluff.headline}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-cream-dim">{bluff.detail}</p>

                {bluff.blockers.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-brass-500/10 pt-3">
                    {bluff.blockers.map((line) => (
                      <li key={line} className="text-xs leading-relaxed text-brass-300">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
                {bluff.reads.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {bluff.reads.map((line) => (
                      <li key={line} className="text-xs leading-relaxed text-cream-faint">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="mt-4 space-y-2.5">
                  {bluff.numbers.map((entry) => (
                    <li key={entry.label} className="border-t border-brass-500/10 pt-2.5">
                      <p className="font-mono text-[9px] tracking-[0.18em] text-cream-faint uppercase">
                        {entry.label}
                      </p>
                      <p className="mt-0.5 font-mono text-[13px] text-cream">{entry.value}</p>
                      {entry.hint && (
                        <p className="mt-0.5 text-xs leading-snug text-cream-faint">{entry.hint}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback && (
              <div
                className={`mt-5 rounded-lg border px-3.5 py-3 ${
                  feedback.ok
                    ? "border-action-call/40 bg-action-call/10"
                    : "border-suit-red/40 bg-suit-red/10"
                }`}
              >
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase">
                  {feedback.ok ? "Jugada según el plan" : `El plan decía: ${feedback.headline}`}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-cream-dim">
                  {feedback.detail}
                </p>
                {feedback.leak && (
                  <div className="mt-3 border-t border-suit-red/20 pt-2.5">
                    <p className="font-mono text-[10px] tracking-[0.14em] text-suit-red uppercase">
                      {feedback.leak.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-cream-dim">
                      {feedback.leak.fix}
                    </p>
                    <Link
                      href={feedback.leak.lesson}
                      className="mt-1.5 inline-block font-mono text-[11px] text-brass-300 underline-offset-4 hover:underline"
                    >
                      Estudiarlo · {feedback.leak.lessonLabel} →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ------------------------------------------------------ fugas */}
          <div className="surface rounded-2xl p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow">Tus fugas</p>
              {misFugas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLeaks({})}
                  className="font-mono text-[10px] tracking-[0.14em] text-cream-faint uppercase hover:text-brass-300"
                >
                  Borrar
                </button>
              )}
            </div>
            {misFugas.length === 0 ? (
              <p className="mt-3 text-[13px] leading-relaxed text-cream-faint">
                Aquí se van juntando los errores que repites. No cuenta cada mano jugada distinto:
                solo las desviaciones que tienen nombre y arreglo.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {misFugas.map((leak) => (
                  <li key={leak.id} className="border-t border-brass-500/10 pt-2.5">
                    <p className="text-[13px] leading-snug text-cream">
                      {leak.title}
                      <span className="ml-2 font-mono text-[11px] text-suit-red">×{leak.count}</span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-cream-faint">{leak.fix}</p>
                    <Link
                      href={leak.lesson}
                      className="mt-1 inline-block font-mono text-[11px] text-brass-300 underline-offset-4 hover:underline"
                    >
                      {leak.lessonLabel} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ------------------------------------------------------ consejo */}
          {tip && (
            <div className="rounded-2xl border border-brass-500/20 bg-brass-500/[0.06] p-5">
              <p className="eyebrow">Consejo de mesa</p>
              <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">{tip.text}</p>
              {tip.lesson && (
                <Link
                  href={tip.lesson}
                  className="mt-2 inline-block font-mono text-[11px] text-brass-300 underline-offset-4 hover:underline"
                >
                  Verlo entero →
                </Link>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Manos" value={String(stats.hands)} />
            <Stat
              label="Ganadas"
              value={stats.hands > 0 ? `${Math.round((stats.won / stats.hands) * 100)}%` : "—"}
            />
            <Stat
              label="Neto"
              value={`${netBB >= 0 ? "+" : "−"}${Math.abs(netBB).toFixed(1)}bb`}
              tone={netBB >= 0 ? "good" : "bad"}
            />
            <Stat
              label="Rastrillo"
              value={`${(stats.rakePaid / BIG_BLIND).toFixed(1)}bb`}
              hint="lo que se ha llevado la casa"
            />
          </div>

          {/* ------------------------------------------------------ mesa */}
          <div className="surface rounded-xl p-5">
            <p className="eyebrow">La mesa</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TABLE_SIZES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => restart({ size: value })}
                  aria-pressed={size === value}
                  title={TABLE_LABELS[value]}
                  className={`h-9 w-9 rounded-full border font-mono text-[12px] transition-colors ${
                    size === value
                      ? "border-brass-400 bg-brass-500/15 text-brass-200"
                      : "border-brass-500/20 text-cream-faint hover:border-brass-500/50"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => restart({ rake: !rake })}
              aria-pressed={rake}
              className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-brass-500/20 px-3 py-2.5 text-left transition-colors hover:border-brass-500/50"
            >
              <span>
                <span className="block font-mono text-[11px] tracking-[0.12em] text-cream-dim uppercase">
                  Rastrillo
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-cream-faint">
                  {RAKE.percent * 100}% del bote, tope {RAKE.capBB}bb, solo si hay flop
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase ${
                  rake ? "bg-brass-500/20 text-brass-200" : "bg-felt-800 text-cream-faint"
                }`}
              >
                {rake ? "Sí" : "No"}
              </span>
            </button>
            <p className="mt-3 text-xs leading-relaxed text-cream-faint">
              Cambiar de mesa o de rastrillo reparte de nuevo. Las fichas son de mentira: esto sirve
              para practicar decisiones, no para medir cuánto ganarías. La sesión se guarda solo en
              tu navegador.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "fold" | "call" | "raise";
}) {
  const styles = {
    default: "border-brass-500/25 text-cream-dim hover:border-brass-500/60 hover:text-brass-200",
    fold: "border-felt-600 text-cream-faint hover:border-suit-red/60 hover:text-suit-red",
    call: "border-action-call/40 text-action-call hover:border-action-call",
    raise: "border-action-raise/50 bg-action-raise/10 text-action-raise hover:border-action-raise",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-5 py-2.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors ${styles[tone]}`}
    >
      {children}
    </button>
  );
}
