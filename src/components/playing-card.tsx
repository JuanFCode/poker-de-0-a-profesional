import { isRedSuit, rankOf, suitOf, RANKS, SUIT_SYMBOLS, type Card } from "@/lib/poker/cards";

const SIZES = {
  sm: "h-12 w-9 text-[13px]",
  md: "h-16 w-12 text-lg",
  lg: "h-24 w-[4.5rem] text-2xl",
} as const;

export function PlayingCard({
  card,
  size = "md",
  className = "",
  faceDown = false,
}: {
  card?: Card;
  size?: keyof typeof SIZES;
  className?: string;
  faceDown?: boolean;
}) {
  if (faceDown || card === undefined) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-card border border-brass-500/25 bg-felt-700 ${SIZES[size]} ${className}`}
      >
        <span className="font-mono text-brass-500/60">♠</span>
      </span>
    );
  }

  const rank = RANKS[rankOf(card)];
  const suit = SUIT_SYMBOLS[suitOf(card)];
  const red = isRedSuit(card);

  return (
    <span
      className={`inline-flex flex-col items-center justify-center rounded-card border border-black/20 bg-cream font-mono font-medium leading-none shadow-[0_6px_16px_-10px_rgba(0,0,0,0.9)] ${SIZES[size]} ${className}`}
      style={{ color: red ? "#b3231f" : "#12201a" }}
    >
      <span>{rank}</span>
      <span className="mt-0.5 text-[0.85em]">{suit}</span>
    </span>
  );
}

/** Una mano de dos cartas, ligeramente abanicada. */
export function CardPair({
  cards,
  size = "md",
}: {
  cards: Card[];
  size?: keyof typeof SIZES;
}) {
  return (
    <span className="inline-flex items-center">
      {cards.map((card, index) => (
        <PlayingCard
          key={`${card}-${index}`}
          card={card}
          size={size}
          className={index === 0 ? "-rotate-6" : "-ml-2 rotate-6"}
        />
      ))}
    </span>
  );
}
