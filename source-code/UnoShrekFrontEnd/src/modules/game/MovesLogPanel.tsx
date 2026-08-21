import { X } from "lucide-react";

export type MoveLogItem = {
  id: string;
  player: string;
  text: string;
};

type Props = {
  onClose: () => void;
  moves?: MoveLogItem[];
};

export function MovesLogPanel({
  onClose,
  moves = [],
}: Props) {
  return (
    <aside className="absolute right-0 top-0 z-40 flex h-full w-[320px] max-w-[85vw] flex-col border-l-[5px] border-[#3D291F] bg-[#FAEFDD] p-5 shadow-[-8px_0_0_rgba(61,41,31,0.25)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-[#3D291F]">
          JOGADAS
        </h2>

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
        <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
          {moves.map((move) => (
            <li
              key={move.id}
              className="rounded-2xl border-[3px] border-[#3D291F] bg-white px-3 py-2"
            >
              <p className="text-sm font-bold text-[#3D291F]">
                {move.player}
              </p>

              <p className="text-xs font-bold text-[#8A7A63]">
                {move.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}