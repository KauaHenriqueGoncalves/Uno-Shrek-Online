import { useState } from "react";
import { Settings, Store, Users, Loader2 } from "lucide-react";
import background from "../../../assets/home-bg.png";
import { GummyButton } from "../../shared/components/GummyButton";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinRoomModal } from "./JoinRoomModal";
import { homeService } from "../lobby/home.service"; 
import { useGameSocket } from "../game/useGameSocket";
import { useAuth } from "../../shared/context/AuthContext";
import { api } from "../../shared/services/api";
import { WaitingRoomModal, WaitingPlayer } from "./WaitingRoomModal";
import axios from "axios";
import { useNavigate } from "@tanstack/react-router";

export function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [quickJoinLoading, setQuickJoinLoading] = useState(false);
  const [waitingGame, setWaitingGame] = useState<{
    code: string;
    players: WaitingPlayer[];
    role: "host" | "guest";
    ownerId: string;
    gameId: string;
  } | null>(null);

  const { createRoom, joinRoom, leaveRoom, setReady, setNotReady, startGame } = useGameSocket({
    onGameInfo: (game) => {

      console.log(" GAME INFO RECEBIDO:", game);

      if (game.status === "playing") {
        navigate({
          to: "/game",
        });

        return;
      }

      const me = user?.id;
      const isHost = game.owner === me;
      const players: WaitingPlayer[] = game.players.map((p) => ({
        id: p.player,
        name: p.username ?? "...",
        level: 1,
        ready: p.ready,
        host: p.player === game.owner,
        you: p.player === me,
      }));
      setWaitingGame({
        code: game.code ?? "",
        players,
        role: isHost ? "host" : "guest",
        ownerId: game.owner,
        gameId: game.id,
      });
      setCreateRoomOpen(false);
      setJoinRoomOpen(false);
    },
    onError: (msg) => console.error("[socket error]", msg),
  });

  const handleCreateRoom = (data: {
    title: string;
    capacity: number;
    bots: boolean;
    botCount: number;
    password: string;
  }) => {
    createRoom({
      title: data.title,
      maxPlayers: data.capacity,
      password: data.password,
    });
    // bots são adicionados via REST após receber o gameId no onGameInfo
  };

  const handleJoinById = (gameId: string, password = "") => {
    joinRoom(gameId, password);
  };

  const handleJoinByCode = async (code: string) => {
    try {
      const { data: game } = await api.get(`/api/games/code/${code}`);
      joinRoom(game.gameId, "");
    } catch {
      console.error("Sala não encontrada");
    }
  };

 const handleQuickJoin = async () => {
  setQuickJoinLoading(true);

  try {
    const { data: game } = await api.get("/api/games/quick-join");

    console.log("Quick join retornou:", game);

    joinRoom(game.gameId, "");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Resposta:", error.response?.data);
    } else {
      console.error(error);
    }
  } finally {
    setQuickJoinLoading(false);
  }
};

  const handleLeave = () => {
    leaveRoom();
    setWaitingGame(null);
  };

  const handlePrimary = () => {
    if (!waitingGame) return;

    if (waitingGame.role === "host") {
      startGame();
      return;
    }

    const me = waitingGame.players.find((p) => p.you);

    if (me?.ready) {
      setNotReady();
    } else {
      setReady();
    }
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
              {user?.username ?? "..."}
            </p>
            <span className="mt-1 inline-block rounded-full border-2 border-[#9CCB45] bg-[#4A3224] px-3 py-0.5 text-xs font-bold text-white">
              Nível 1
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
          className="flex h-16 w-full max-w-[300px] items-center justify-center font-display text-2xl tracking-wide"
        >
          {quickJoinLoading
            ? <Loader2 size={24} className="animate-spin" />
            : "JOGAR AGORA"
          }
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
          onConfirm={handleCreateRoom}
        />
      )}

      {joinRoomOpen && (
        <JoinRoomModal
          onClose={() => setJoinRoomOpen(false)}
          onJoinById={handleJoinById}
          onJoinByCode={handleJoinByCode}
        />
      )}

      {waitingGame && (
        <WaitingRoomModal
          role={waitingGame.role}
          code={waitingGame.code}
          players={waitingGame.players}
          capacity={4}
          onLeave={handleLeave}
          onPrimary={handlePrimary}
        />
      )}
    </main>
  );
}