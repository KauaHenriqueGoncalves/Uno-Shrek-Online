import miniCards from "../../../assets/cards/specials/urro-back.png";

export type Opponent = {
  id: string;
  name: string;
  avatar?: string;
  cards: number;
  active?: boolean;
};

export function OpponentSeat({
  player,
}: {
  player: Opponent;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          h-14
          w-14
          overflow-hidden
          rounded-xl
          border-[3px]
          border-[#3D291F]
          bg-[#FAEFDD]
          ${
            player.active
              ? "shadow-[0_0_18px_6px_#ED1C24]"
              : ""
          }
        `}
      >
        {player.avatar && (
          <img
            src={player.avatar}
            alt={player.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <span className="max-w-[140px] truncate rounded-full bg-[#4A3525] px-3 py-0.5 text-xs font-bold text-white">
        {player.name}
      </span>

      <div className="flex items-center">
        {Array.from({
          length: Math.min(player.cards, 6),
        }).map((_, index) => (
          <img
            key={index}
            src={miniCards}
            alt=""
            className="-ml-2 h-7 w-[19px] object-contain first:ml-0"
          />
        ))}

        <span className="ml-1 text-[10px] font-bold text-white drop-shadow-[0_1px_0_#3D291F]">
          {player.cards}
        </span>
      </div>
    </div>
  );
}