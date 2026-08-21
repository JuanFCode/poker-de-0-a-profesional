"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveTable } from "@/components/live-table";
import { PlayingCard } from "@/components/playing-card";
import { TableSizePicker } from "@/components/table-size-picker";
import { Stat, ToolShell } from "@/components/tool-shell";
import { botMove } from "@/lib/poker/bot";
import { advise, matchesAdvice, type Advice } from "@/lib/poker/coach";
import {
  applyAction,
  BIG_BLIND,
  createGame,
  EMPTY_STATS,
  formatBB,
  isHeroTurn,
  legalMoves,
  revealedSeats,
  startHand,
  STREET_LABEL,
  type GameAction,
  type GameState,
  type SessionStats,
} from "@/lib/poker/game";
import { type TableSize } from "@/lib/poker/ranges";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";

/** Milisegundos que tarda cada rival en decidir: lo justo para poder seguirlo. */
const BOT_DELAY = 700;

interface Feedback {
  ok: boolean;
  headline: string;
  detail: string;
}

export function GameTool() {
  const [stats, setStats] = useStoredState<SessionStats>(STORAGE_KEYS.game, EMPTY_STATS);
  const [size, setSize] = useState<TableSize>(6);
  // Semilla fija en el primer render para que el HTML del servidor y el del
  // cliente coincidan; al repartir se cambia por una de verdad.
  const [state, setState] = useState<GameState>(() => createGame({ size: 6 }));
  const [coachOn, setCoachOn] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [botNote, setBotNote] = useState<string | null>(null);
  /** Lo que has movido tú el deslizador; si no lo tocas manda la sugerencia. */
  const [raiseOverride, setRaiseOverride] = useState<number | null>(null);

  const heroTurn = isHeroTurn(state) && state.result === null;
  const legal = heroTurn ? legalMoves(state, state.heroSeat) : null;
  const hero = state.players[state.heroSeat];

  // El plan del entrenador para la decisión que tienes delante.
  const advice: Advice | null = useMemo(
    () => (heroTurn && hero.cards.length === 2 ? advise(state, state.heroSeat) : null),
    [state, heroTurn, hero.cards.length],
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

  const deal = () => {
    setFeedback(null);
    setBotNote(null);
    setRaiseOverride(null);
    const base =
      state.handNumber === 0 || state.size !== size
        ? createGame({ size, seed: (Math.random() * 0x7fffffff) | 0, stats })
        : state;
    setState(startHand(base));
  };

  const changeSize = (value: TableSize) => {
    setSize(value);
    setFeedback(null);
    setBotNote(null);
    setRaiseOverride(null);
    setState(createGame({ size: value, seed: (Math.random() * 0x7fffffff) | 0, stats }));
  };

  const act = (action: GameAction) => {
    if (!heroTurn) return;
    setRaiseOverride(null);
    if (advice) {
      setFeedback({
        ok: matchesAdvice(advice, action),
        headline: advice.headline,
        detail: advice.detail,
      });
    }
    setState((current) => applyAction(current, action));
  };

  const revealed = revealedSeats(state);
  const handLog = state.log.filter((entry) => entry.hand === state.handNumber).slice(-9);
  const netBB = stats.net / BIG_BLIND;

  return (
    <ToolShell
      eyebrow="La mesa"
      title="Juega una mano de verdad"
      intro="Una mesa completa contra rivales que no improvisan: preflop consultan los mismos rangos del curso y del flop en adelante calculan su equity y sus pot odds. Antes de cada decisión tuya, el entrenador te dice qué dice el plan y por qué."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                  {hero.cards.map((card, index) => (
                    <PlayingCard key={`${card}-${index}`} card={card} size="sm" />
                  ))}
                  <span className="ml-1 font-mono text-[10px] text-cream-faint">
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

            {coachOn && advice ? (
              <div className="mt-4">
                <p className="font-display text-2xl leading-tight text-brass-200">
                  {advice.headline}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-cream-faint uppercase">
                  {advice.source}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-cream-dim">{advice.detail}</p>
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
              </div>
            ) : (
              <p className="mt-3 text-[14px] leading-relaxed text-cream-faint">
                {coachOn
                  ? "Cuando te toque hablar aparece aquí el plan: de qué rango sale la decisión, qué equity tienes y qué precio te están poniendo."
                  : "Entrenador oculto: juega a ciegas y compara al final de la mano."}
              </p>
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
              </div>
            )}
          </div>

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
            <Stat label="Bote mayor" value={formatBB(stats.biggestPot)} />
          </div>

          <TableSizePicker size={size} onChange={changeSize} />

          <p className="text-xs leading-relaxed text-cream-faint">
            Fichas de mentira y sin rastrillo: esto sirve para practicar decisiones, no para medir
            cuánto ganarías. Las manos se reparten al azar y la sesión se guarda solo en tu
            navegador.
          </p>
        </aside>
      </div>
    </ToolShell>
  );
}

/** Paso del deslizador de subida: media ciega grande. */
const SMALL_STEP = BIG_BLIND / 2;

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
