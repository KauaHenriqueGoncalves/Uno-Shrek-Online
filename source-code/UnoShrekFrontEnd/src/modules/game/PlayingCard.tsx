import type { GameCard } from "./useGameSocket";
import {
  getCardImage,
  cardAssets,
} from "./cardAssets";

type PlayingCardProps = {
  card: GameCard;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function PlayingCard({
  card,
  className = "",
  onClick,
  disabled = false,
}: PlayingCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative
        h-[124px]
        w-[84px]
        shrink-0
        overflow-hidden
        rounded-xl
        transition
        hover:-translate-y-3
        disabled:cursor-default
        disabled:opacity-70
        ${className}
      `}
    >
      <img
        src={getCardImage(card)}
        alt={`${card.color} ${card.value ?? card.type}`}
        className="h-full w-full object-contain"
      />
    </button>
  );
}

type CardBackProps = {
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function CardBack({
  className = "",
  onClick,
  disabled = false,
}: CardBackProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        h-[124px]
        w-[84px]
        shrink-0
        overflow-hidden
        rounded-xl
        transition
        hover:-translate-y-2
        disabled:cursor-default
        disabled:opacity-60
        ${className}
      `}
    >
      <img
        src={cardAssets.specials.back}
        alt="Monte de cartas"
        className="h-full w-full object-contain"
      />
    </button>
  );
}