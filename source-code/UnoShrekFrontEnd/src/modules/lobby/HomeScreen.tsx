import { useState } from "react";
import { Settings, Store, Users, Loader2 } from "lucide-react";
import background from "../../../assets/home-bg.png";
import { GummyButton } from "../../shared/components/GummyButton";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinRoomModal } from "./JoinRoomModal";
import { homeService } from "../lobby/home.service"; 

const player = { name: "Pedro", level: 12 };

export function HomeScreen() {
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [quickJoinLoading, setQuickJoinLoading] = useState(false);

  const handleQuickJoin = async () => {
    setQuickJoinLoading(true);

    try {
      const game = await homeService.quickJoin();

      // TODO: abrir WaitingRoomModal com game.gameId e game.code
      console.log("quick join", game);
    } catch {
      // TODO: mostrar erro
    } finally {
      setQuickJoinLoading(false);
    }
  };

  const handleEnterRoom = (gameId: string, code: string) => {
    setCreateRoomOpen(false);
    setJoinRoomOpen(false);

    // TODO: abrir WaitingRoomModal com gameId e code
    console.log("enter room", { gameId, code });
  };

  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden">
      <img
        src={background}
        alt="Personagens do pântano do URRO"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/25" />

      <header className="relative flex items-start justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full border-4 border-[#9CCB45] bg-[#F4EBD9] shadow-[0_4px_0_#3D291F]" />

          <div>
            <p className="font-display text-xl text-white drop-shadow-[0_2px_0_#3D291F]">
              {player.name}
            </p>

            <span className="mt-1 inline-block rounded-full border-2 border-[#9CCB45] bg-[#4A3224] px-3 py-0.5 text-xs font-bold text-white">
              Nível {player.level}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Configurações"
          className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#4A3525] bg-[#A9C938] text-[#3D291F] shadow-[0_5px_0_#3D291F] transition active:translate-y-1 active:shadow-[0_2px_0_#3D291F]"
        >
          <Settings size={26} />
        </button>
      </header>

      <section className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-6xl text-[#FFF200] drop-shadow-[0_6px_0_#4A3525] sm:text-7xl md:text-8xl">
          URRO
        </h1>

        <GummyButton
          variant="green"
          onClick={handleQuickJoin}
          disabled={quickJoinLoading}
          className="h-16 w-full max-w-[300px] font-display text-2xl tracking-wide"
        >
          {quickJoinLoading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            "JOGAR AGORA"
          )}
        </GummyButton>

        <GummyButton
          variant="cream"
          onClick={() => setCreateRoomOpen(true)}
          className="h-12 w-full max-w-[300px] text-lg"
        >
          Criar Sala
        </GummyButton>

        <GummyButton
          variant="yellow"
          onClick={() => setJoinRoomOpen(true)}
          className="h-12 w-full max-w-[300px] text-lg"
        >
          Entrar na Sala
        </GummyButton>
      </section>

      <footer className="relative flex items-center justify-between p-6">
        <GummyButton variant="red" className="h-14 text-xl">
          <Store size={24} />
          Loja
        </GummyButton>

        <GummyButton variant="brown" className="h-14 text-xl">
          <Users size={24} />
          Amigos
        </GummyButton>
      </footer>

      {createRoomOpen && (
        <CreateRoomModal
          onClose={() => setCreateRoomOpen(false)}
          onEnterRoom={handleEnterRoom}
        />
      )}

      {joinRoomOpen && (
        <JoinRoomModal
          onClose={() => setJoinRoomOpen(false)}
          onEnterRoom={handleEnterRoom}
        />
      )}
    </main>
  );
}