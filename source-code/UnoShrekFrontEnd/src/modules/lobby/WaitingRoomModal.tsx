import { Check, Clock, Crown } from "lucide-react";
import { GummyButton } from "../../shared/components/GummyButton";

export type WaitingPlayer = { id: string; name: string; level: number; ready: boolean; host?: boolean; you?: boolean };

type Props = {
  role: "host" | "guest";
  code: string;
  capacity?: number;
  players: WaitingPlayer[];
  onLeave: () => void;
  onPrimary: () => void;
};

export function WaitingRoomModal({ role, code, capacity = 4, players, onLeave, onPrimary }: Props) {
  const sortedPlayers = [...players].sort((a, b) => Number(b.host) - Number(a.host));
  const slots = Array.from({ length: capacity }, (_, i) => sortedPlayers[i] ?? null);
  const allReady = sortedPlayers.length > 1 && sortedPlayers.every((p) => p.ready);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[560px] rounded-3xl border-[5px] border-[#3D291F] bg-[#FAEFDD] p-6 shadow-[0_10px_0_#3D291F]">
        <h2 className="text-center font-display text-3xl text-[#3D291F]">SALA DE ESPERA</h2>

        <div className="mt-3 flex justify-center">
          <span className="rounded-full bg-[#EADFC8] px-5 py-1.5 text-sm font-bold text-[#8A7A63]">
            Código: {code}
          </span>
        </div>

        <div className="my-5 h-[2px] rounded-full bg-[#3D291F]/15" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {slots.map((player, index) =>
            player ? (
              <div
                key={player.id}
                className={`relative flex items-center gap-3 rounded-2xl border-[3px] border-[#3D291F] px-3 py-3 ${
                  player.ready ? "bg-[#A9C938]" : "bg-white"
                }`}
              >
                {player.host && (
                  <Crown size={18} className="absolute -top-3 left-4 fill-[#FFC93C] text-[#3D291F]" />
                )}
                <div className="h-12 w-12 shrink-0 rounded-full border-[3px] border-[#3D291F] bg-[#FAEFDD]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#3D291F]">
                    {player.name}
                    {player.you ? " (Você)" : ""}
                  </p>
                  <p className="text-xs font-bold text-[#8A7A63]">Nível {player.level}</p>
                </div>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[3px] border-[#3D291F] ${
                    player.ready ? "bg-white text-[#6E9B12]" : "bg-[#FAEFDD] text-[#3D291F]"
                  }`}
                >
                  {player.ready ? <Check size={16} strokeWidth={4} /> : <Clock size={16} />}
                </span>
              </div>
            ) : (
              <div
                key={`empty-${index}`}
                className="flex h-[72px] items-center justify-center rounded-2xl border-[3px] border-dashed border-[#3D291F]/30 bg-[#3D291F]/5 text-sm font-bold text-[#8A7A63]"
              >
                Aguardando...
              </div>
            ),
          )}
        </div>

        <div className="my-5 h-[2px] rounded-full bg-[#3D291F]/15" />

        <div className="flex gap-3">
          <GummyButton variant="red" onClick={onLeave} className="h-12 font-display text-base">
            SAIR
          </GummyButton>
          <GummyButton
            variant="green"
            onClick={onPrimary}
            disabled={role === "host" && !allReady}
            className="h-12 flex-1 font-display text-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {role === "host" ? "COMEÇAR PARTIDA" : "ESTOU PRONTO!"}
          </GummyButton>
        </div>
      </div>
    </div>
  );
}
