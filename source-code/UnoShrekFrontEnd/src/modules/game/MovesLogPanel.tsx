import { Clock3, UserRound, X } from "lucide-react";

export type MoveLogItem = {
  id: string;
  player: string;
  text: string;
  avatar?: string;
  color?: "red" | "blue" | "green" | "yellow";
  elapsedTime: string;
};

const COLOR_TEXT_CLASS = {
  red: "text-[#ED1C24]",
  blue: "text-[#1677D2]",
  green: "text-[#5D9213]",
  yellow: "text-[#C28A00]",
} as const;

type Props = {
  onClose: () => void;
  moves?: MoveLogItem[];
};

export function MovesLogPanel({
  onClose,
  moves = [],
}: Props) {
  return (
    <aside className="absolute right-0 top-0 z-40 flex h-full w-[350px] max-w-[90vw] flex-col border-l-[5px] border-[#3D291F] bg-[#FAEFDD] p-5 shadow-[-8px_0_0_rgba(61,41,31,0.25)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#3D291F]">JOGADAS</h2>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A7A63]">
            Registro da partida
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar registro de jogadas"
          className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#3D291F] bg-[#ED1C24] text-white"
        >
          <X
            size={18}
            strokeWidth={3}
          />
        </button>
      </div>

      <div className="my-4 h-[2px] rounded-full bg-[#3D291F]/15" />

      {moves.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <p className="text-sm font-bold text-[#8A7A63]">
            Nenhuma jogada disponível.
          </p>
        </div>
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto pr-1">
          {moves.map((move) => (
            <li
              key={move.id}
              className="rounded-2xl border-[3px] border-[#3D291F]/20 bg-white px-3 py-3 shadow-[0_3px_0_rgba(61,41,31,0.12)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#3D291F] bg-[#A9C938] text-[#3D291F]">
                  {move.avatar ? (
                    <img src={move.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={20} strokeWidth={2.5} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-black text-[#3D291F]">
                      {move.player}
                    </p>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-black text-[#8A7A63]">
                      <Clock3 size={12} strokeWidth={2.5} />
                      {move.elapsedTime}
                    </span>
                  </div>

                  <p className={`mt-1 text-xs font-black ${move.color ? COLOR_TEXT_CLASS[move.color] : "text-[#8A7A63]"}`}>
                    {move.text}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}