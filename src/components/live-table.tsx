"use client";

import { PlayingCard } from "@/components/playing-card";
import { formatBB, type GameState } from "@/lib/poker/game";

/** Radios del óvalo, en porcentaje del contenedor (los mismos que la mesa del curso). */
const RADIUS_X = 40;
const RADIUS_Y = 34;

interface SeatSpot {
  seat: number;
  x: number;
  y: number;
  isHero: boolean;
}

/** Sillas alrededor del óvalo, contigo siempre abajo en el centro. */
function spots(state: GameState): SeatSpot[] {
  const step = 360 / state.size;
  return state.players.map((player) => {
    const index = (player.seat - state.heroSeat + state.size) % state.size;
    const angle = ((90 + index * step) * Math.PI) / 180;
    return {
      seat: player.seat,
      x: Math.round((50 + RADIUS_X * Math.cos(angle)) * 100) / 100,
      y: Math.round((50 + RADIUS_Y * Math.sin(angle)) * 100) / 100,
      isHero: player.seat === state.heroSeat,
    };
  });
}

export function LiveTable({
  state,
  revealed,
  className = "",
}: {
  state: GameState;
  /** Sillas que enseñan cartas. */
  revealed: number[];
  className?: string;
}) {
  const winners = new Set(
    (state.result?.payouts ?? []).filter((share) => share.amount > 0).map((share) => share.seat),
  );

  return (
    <div className={`relative mx-auto aspect-[6/7] w-full max-w-[620px] sm:aspect-[3/2] ${className}`}>
      {/* El tapete. */}
      <div className="absolute inset-x-[13%] inset-y-[17%] rounded-[50%] border-2 border-brass-500/25 bg-felt-800/70 shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-[6px] rounded-[50%] border border-brass-500/10" />
      </div>

      {/* Board y bote. */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-center">
        <div className="flex min-h-[3.5rem] items-center justify-center gap-1 sm:gap-1.5">
          {state.board.map((card, index) => (
            <PlayingCard key={`${card}-${index}`} card={card} size="sm" className="animate-rise" />
          ))}
          {state.board.length === 0 && (
            <p className="font-mono text-[10px] tracking-[0.18em] text-cream-faint uppercase">
              {state.handNumber === 0 ? "Mesa lista" : "Preflop"}
            </p>
          )}
        </div>
        <p className="mt-2 font-mono text-[11px] tracking-[0.16em] text-brass-300 uppercase">
          Bote{" "}
          {formatBB(
            state.result
              ? state.result.pot
              : state.pot + state.players.reduce((sum, player) => sum + player.bet, 0),
          )}
        </p>
      </div>

      {spots(state).map((spot) => {
        const player = state.players[spot.seat];
        const isTurn = state.toAct === spot.seat;
        const showCards = revealed.includes(spot.seat) && player.cards.length > 0;
        const isWinner = winners.has(spot.seat);
        const isButton = spot.seat === state.buttonSeat;

        return (
          <div key={spot.seat}>
            {/* Fichas apostadas, entre la silla y el centro. */}
            {player.bet > 0 && (
              <span
                style={{
                  left: `${50 + 0.66 * (spot.x - 50)}%`,
                  top: `${50 + 0.66 * (spot.y - 50)}%`,
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass-500/40 bg-felt-950/90 px-2 py-0.5 font-mono text-[9px] text-brass-200"
              >
                {formatBB(player.bet)}
              </span>
            )}

            <div
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className={`absolute w-[27%] min-w-[62px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-1.5 py-1.5 text-center transition-all duration-300 ${
                player.folded
                  ? "border-felt-600/60 bg-felt-900/70 opacity-45"
                  : isWinner
                    ? "z-10 border-action-call bg-action-call/20 shadow-[0_0_0_3px_rgba(79,157,107,0.2)]"
                    : isTurn
                      ? "z-10 border-brass-400 bg-felt-800 shadow-[0_0_0_3px_rgba(201,162,39,0.22)]"
                      : "border-brass-500/20 bg-felt-850"
              }`}
            >
              {isButton && (
                <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full border border-brass-400 bg-felt-950 font-mono text-[9px] text-brass-300">
                  D
                </span>
              )}

              <div className="flex items-center justify-center gap-0.5">
                {player.cards.length === 0 ? (
                  <span className="block h-9" />
                ) : showCards ? (
                  player.cards.map((card, index) => (
                    <PlayingCard key={`${card}-${index}`} card={card} size="xs" />
                  ))
                ) : (
                  player.cards.map((_, index) => <PlayingCard key={index} size="xs" faceDown />)
                )}
              </div>

              <p
                className={`mt-1 truncate font-mono text-[10px] leading-tight ${
                  spot.isHero ? "text-brass-200" : "text-cream-dim"
                }`}
              >
                {player.name} · {player.position}
              </p>
              <p className="font-mono text-[9px] leading-tight text-cream-faint">
                {formatBB(player.stack)}
                {/* El estilo del rival a la vista: es la lectura que se explota. */}
                {!spot.isHero && <span className="text-cream-faint/70"> · {player.style}</span>}
              </p>
              {player.lastAction && !player.folded && (
                <p className="mt-0.5 truncate font-mono text-[9px] leading-tight text-brass-300/90">
                  {player.lastAction}
                </p>
              )}
              {player.folded && player.cards.length > 0 && (
                <p className="mt-0.5 font-mono text-[9px] leading-tight text-cream-faint">fold</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
