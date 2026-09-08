import { forwardRef } from "react";

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
  selected?: boolean;
  entering?: boolean;
};

export const PlayingCard = forwardRef<HTMLButtonElement, PlayingCardProps>(
  function PlayingCard(
    {
      card,
      className = "",
      onClick,
      disabled = false,
      selected = false,
      entering = false,
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={`${card.color} ${card.value ?? card.type}`}
        className={`
          playing-card
          relative
          h-[124px]
          w-[84px]
          shrink-0
          overflow-hidden
          rounded-xl
          transform-gpu
          will-change-transform
          ${selected ? "card-selected" : ""}
          ${entering ? "card-enter" : ""}
          disabled:cursor-default
          disabled:opacity-70
          ${className}
        `}
      >
        <img
          src={getCardImage(card)}
          alt={`${card.color} ${card.value ?? card.type}`}
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-contain"
        />
      </button>
    );
  },
);

PlayingCard.displayName = "PlayingCard";

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
      aria-label="Comprar carta"
      className={`
        card-back
        h-[124px]
        w-[84px]
        shrink-0
        overflow-hidden
        rounded-xl
        transform-gpu
        transition-[transform,filter] duration-150 ease-out
        hover:-translate-y-2
        hover:scale-[1.02]
        hover:brightness-105
        active:scale-95
        disabled:cursor-default
        disabled:opacity-60
        ${className}
      `}
    >
      <img
        src={cardAssets.specials.back}
        alt="Monte de cartas"
        draggable={false}
        className="pointer-events-none h-full w-full select-none object-contain"
      />
    </button>
  );
}