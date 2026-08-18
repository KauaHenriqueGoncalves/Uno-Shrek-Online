import { useState, useEffect } from "react";
import { User, Loader2 } from "lucide-react";
import { GummyButton } from "../../shared/components/GummyButton";
import { api } from "../../shared/services/api";

type Room = { id: string; name: string; players: number; capacity: number; code: string };

type Props = {
  onClose: () => void;
  onJoinById: (gameId: string, password?: string) => void;
  onJoinByCode: (code: string) => void;
};

export function JoinRoomModal({ onClose, onJoinById, onJoinByCode }: Props) {
  const [code, setCode] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/games/status/pending")
      .then((res) =>
        setRooms(
          res.data.map((g: any) => ({
            id: g.id,
            name: g.title,
            players: g.totalPlayers?.split("/")[0] ?? 0,
            capacity: g.maxPlayers,
            code: g.code,
          })),
        ),
      )
      .catch(() => setError("Erro ao carregar salas."))
      .finally(() => setLoadingRooms(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[420px] rounded-3xl border-[5px] border-[#4A3525] bg-[#FAEFDD] p-6 shadow-[0_10px_0_#3D291F]">
        <h2 className="text-center font-display text-2xl text-[#4A3525]">ENTRAR NA SALA</h2>
        <div className="my-4 h-[3px] rounded-full bg-[#4A3525]/25" />

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <p className="mb-2 text-xs font-bold tracking-wide text-[#4A3525]/70">TEM UM CÓDIGO?</p>
        <div className="mb-4 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: URRO-5X9Q"
            className="h-12 flex-1 rounded-xl border-[3px] border-[#4A3525] bg-white px-4 text-[#4A3525] outline-none placeholder:text-[#4A3525]/40 focus:border-[#9CCB45] focus:ring-2 focus:ring-[#9CCB45]/50"
          />
          <GummyButton
            variant="yellow"
            onClick={() => onJoinByCode(code)}
            disabled={!code.trim()}
            className="h-12 font-display text-sm"
          >
            BUSCAR
          </GummyButton>
        </div>

        <div className="mb-3 flex items-center gap-3 text-xs font-bold text-[#4A3525]/50">
          <span className="h-[2px] flex-1 bg-[#4A3525]/20" />
          OU
          <span className="h-[2px] flex-1 bg-[#4A3525]/20" />
        </div>

        <p className="mb-2 text-xs font-bold tracking-wide text-[#4A3525]/70">SALAS PÚBLICAS</p>
        <div className="mb-5 max-h-[210px] space-y-2 overflow-y-auto rounded-2xl border-[3px] border-[#4A3525] bg-[#FDF8E4] p-2">
          {loadingRooms ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={24} className="animate-spin text-[#4A3525]" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#4A3525]/50">
              Nenhuma sala disponível.
            </p>
          ) : (
            rooms.map((room) => {
              const full = room.players >= room.capacity;
              return (
                <div
                  key={room.id}
                  className={`flex items-center gap-3 rounded-xl border-[3px] border-[#4A3525] px-3 py-2 ${
                    full ? "opacity-50" : "bg-white"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#4A3525]">{room.name}</p>
                    <p className="flex items-center gap-1 text-xs text-[#8A6B2F]">
                      <User size={12} />
                      {room.players}/{room.capacity} {full ? "(Lotada)" : "Jogadores"}
                    </p>
                  </div>
                  <GummyButton
                    variant={full ? "cream" : "green"}
                    disabled={full}
                    onClick={() => onJoinById(room.id)}
                    className="h-9 px-4 font-display text-xs disabled:cursor-not-allowed"
                  >
                    {full ? "CHEIA" : "ENTRAR"}
                  </GummyButton>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-center">
          <GummyButton variant="cream" onClick={onClose} className="h-11 px-10 font-display text-sm">
            CANCELAR
          </GummyButton>
        </div>
      </div>
    </div>
  );
}