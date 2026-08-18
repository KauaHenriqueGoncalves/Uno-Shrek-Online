import { useState } from "react";
import { GummyButton } from "../../shared/components/GummyButton";

type Props = {
  onClose: () => void;
  onConfirm: (data: {
    title: string;
    capacity: number;
    bots: boolean;
    botCount: number;
    password: string;
  }) => void;
};

const capacities = [4, 3, 2];
const botCounts = [1, 2, 3];

export function CreateRoomModal({ onClose, onConfirm }: Props) {
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [bots, setBots] = useState(true);
  const [botCount, setBotCount] = useState(3);
  const [password, setPassword] = useState("");

  const pill = (active: boolean) =>
    `h-11 w-14 rounded-xl border-[3px] border-[#4A3525] font-display text-lg transition ${
      active ? "bg-[#A9C938] text-white" : "bg-[#FDF8E4] text-[#4A3525]"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[440px] rounded-3xl border-[6px] border-[#4A3525] bg-[#FDF8E4] p-6 shadow-[0_10px_0_#3D291F]">
        <h2 className="text-center font-display text-3xl text-[#4A3525]">CRIAR SALA</h2>
        <div className="my-4 h-[3px] rounded-full bg-[#4A3525]/25" />

        <p className="mb-2 font-bold text-[#4A3525]">Lotação (Jogadores)</p>
        <div className="mb-4 flex gap-3">
          {capacities.map((n) => (
            <button key={n} type="button" onClick={() => setCapacity(n)} className={pill(capacity === n)}>
              {n}
            </button>
          ))}
        </div>

        <p className="mb-2 font-bold text-[#4A3525]">Bots na Partida</p>
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBots(!bots)}
            aria-pressed={bots}
            className={`flex h-8 w-8 items-center justify-center rounded-md border-[3px] border-[#4A3525] font-bold ${
              bots ? "bg-[#A9C938] text-[#4A3525]" : "bg-white text-transparent"
            }`}
          >
            ✓
          </button>
          <span className="font-bold text-[#4A3525]">Ativar Bots</span>
          <span className="ml-auto text-sm text-[#4A3525]/60">Quantos?</span>
          <div className="flex gap-2">
            {botCounts.map((n) => (
              <button
                key={n}
                type="button"
                disabled={!bots}
                onClick={() => setBotCount(n)}
                className={`h-9 w-9 rounded-lg border-[3px] border-[#4A3525] text-sm font-bold transition disabled:opacity-40 ${
                  bots && botCount === n ? "bg-[#A9C938] text-white" : "bg-[#FDF8E4] text-[#4A3525]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        
        <p className="mb-2 font-bold text-[#4A3525]">Nome da Sala</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Digite o nome da sala..."
          minLength={3}
          maxLength={60}
          required
          className="mb-4 h-12 w-full rounded-xl border-[3px] border-[#4A3525] bg-white px-4 text-[#4A3525] outline-none placeholder:text-[#4A3525]/40 focus:border-[#9CCB45] focus:ring-2 focus:ring-[#9CCB45]/50"
        />

        <p className="mb-2 font-bold text-[#4A3525]">Senha da Sala (Opcional)</p>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Deixe em branco para sala pública..."
          className="mb-5 h-12 w-full rounded-xl border-[3px] border-[#4A3525] bg-white px-4 text-[#4A3525] outline-none placeholder:text-[#4A3525]/40 focus:border-[#9CCB45] focus:ring-2 focus:ring-[#9CCB45]/50"
        />

        <div className="flex gap-3">
          <GummyButton variant="cream" onClick={onClose} className="h-12 flex-1 font-display text-lg">
            CANCELAR
          </GummyButton>
          <GummyButton
            variant="green"
            disabled={title.trim().length < 3}
            onClick={() => onConfirm({ 
              title: title.trim(), 
              capacity, 
              bots, 
              botCount, 
              password })}
            className="h-12 flex-[1.4] font-display text-lg"
          >
            PRONTO!
          </GummyButton>
        </div>
      </div>
    </div>
  );
}