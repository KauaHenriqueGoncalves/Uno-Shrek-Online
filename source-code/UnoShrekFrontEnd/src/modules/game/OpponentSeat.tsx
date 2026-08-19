export type Opponent = { id: string; name: string; avatar?: string; cards: number; active?: boolean };

export function OpponentSeat({ player }: { player: Opponent }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`h-14 w-14 overflow-hidden rounded-xl border-[3px] border-[#3D291F] bg-[#FAEFDD] ${
          player.active ? "shadow-[0_0_18px_6px_#ED1C24]" : ""
        }`}
      >
        {player.avatar && <img src={player.avatar} alt={player.name} className="h-full w-full object-cover" />}
      </div>
      <span className="max-w-[140px] truncate rounded-full bg-[#4A3525] px-3 py-0.5 text-xs font-bold text-white">
        {player.name}
      </span>
      <div className="flex">
        {Array.from({ length: Math.min(player.cards, 6) }).map((_, i) => (
          <span
            key={i}
            className="-ml-1 flex h-6 w-4 items-center justify-center rounded-[3px] border border-[#1E1E1E] bg-[#1E1E1E] first:ml-0"
          >
            <span className="h-3 w-2 rounded-[2px] bg-[#ED1C24]" />
          </span>
        ))}
        <span className="ml-1 text-[10px] font-bold text-white drop-shadow-[0_1px_0_#3D291F]">{player.cards}</span>
      </div>
    </div>
  );
}