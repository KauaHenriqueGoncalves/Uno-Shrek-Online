import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Hourglass, Settings, Smile } from "lucide-react";
import background from "../../../assets/home-bg.png";
import { CardBack, PlayingCard } from "./PlayingCard";
import { OpponentSeat } from "./OpponentSeat";
import { MovesLogPanel } from "./MovesLogPanel";
import { useGameSocket, type GameCard, type GameInfo } from "./useGameSocket";
import { useAuth } from "../../shared/context/AuthContext";

export function GameScreen() {
  const { user } = useAuth();
  const [movesOpen, setMovesOpen] = useState(false);
  const [game, setGame] = useState<GameInfo | null>(null);

  const {
    getGameInfo,
    drawCard,
    playCard,
    sayUno,
  } = useGameSocket({
    onGameInfo: (gameData) => {
      console.log("[GAME SCREEN] Game updated:", gameData);

      setGame(gameData);
    },

    onError: (message) => {
      console.error("[GAME SCREEN] Error:", message);
    },
  });

  useEffect(() => {
    getGameInfo();
  }, [getGameInfo]);

  const myPlayer = useMemo(() => {
  if (!game || !user) {
    return null;
  }

  return (
    game.players.find(
      (player) => player.player === user.id,
    ) ?? null
  );
}, [game, user]);

  const opponents = useMemo(() => {
    if (!game || !myPlayer) {
      return [];
    }

    return game.players.filter(
      (player) =>
        player.player !== myPlayer.player,
    );
  }, [game, myPlayer]);

  const topOpponent = opponents[0];
  const leftOpponent = opponents[1];
  const rightOpponent = opponents[2];

  const currentPlayer = useMemo(() => {
    if (!game) {
      return null;
    }

    return (
      game.players.find(
        (player) =>
          player.player === game.currentPlayer,
      ) ?? null
    );
  }, [game]);

  const clockwise =
    game?.direction !== -1;

  const discardCard =
    game?.discard[
      game.discard.length - 1
    ];

  function convertOpponent(
    player?: GamePlayer,
  ): Opponent | null {
    if (!player) {
      return null;
    }

    return {
      id: player.player,
      name: player.username,
      cards: player.hand.cards.length,
      active:
        player.player ===
        game?.currentPlayer,
    };
  }

  const topPlayer =
    convertOpponent(topOpponent);

  const leftPlayer =
    convertOpponent(leftOpponent);

  const rightPlayer =
    convertOpponent(rightOpponent);

  const isMyTurn =
    myPlayer?.player ===
    game?.currentPlayer;

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden">
      <img
        src={background}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/45" />

      <header className="relative z-10 flex items-start justify-between p-4">
        <div className="flex items-center gap-2 rounded-full border-[3px] border-[#3D291F] bg-[#FAEFDD] px-4 py-1.5">
          <Hourglass
            size={20}
            className="text-[#ED1C24]"
          />

          <span className="font-display text-xl text-[#3D291F]">
            00:59
          </span>
        </div>

        <div className="mt-1 rounded-full border-[3px] border-[#3D291F] bg-[#FFF200] px-5 py-1.5 font-display text-base text-[#3D291F]">
          {currentPlayer
            ? `Vez de ${currentPlayer.username}`
            : "Aguardando..."}
        </div>

        <button
          type="button"
          aria-label="Configurações"
          className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#4A3525] bg-[#A9C938] text-[#3D291F] shadow-[0_4px_0_#3D291F] active:translate-y-1"
        >
          <Settings size={22} />
        </button>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-between px-4">
        {leftPlayer && (
          <OpponentSeat
            player={leftPlayer}
          />
        )}

        <div className="relative flex items-center justify-center">
          <div
            className={`absolute h-[300px] w-[300px] rounded-full border-[6px] border-dashed border-[#FAEFDD]/80 sm:h-[360px] sm:w-[360px] ${
              clockwise
                ? "animate-[spin_18s_linear_infinite]"
                : "animate-[spin_18s_linear_infinite_reverse]"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-display text-2xl text-[#FAEFDD]">
              {clockwise
                ? "▶"
                : "◀"}
            </span>

            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 font-display text-2xl text-[#FAEFDD]">
              {clockwise
                ? "◀"
                : "▶"}
            </span>
          </div>

          <div className="relative flex items-center gap-5">
            <CardBack
              onClick={drawCard}
              disabled={!isMyTurn}
            />

            {discardCard && (
              <PlayingCard
                card={discardCard}
                className="rotate-6 hover:translate-y-0"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          {rightPlayer && (
            <OpponentSeat
              player={rightPlayer}
            />
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-16 z-10 flex justify-center">
        <div className="pointer-events-auto">
          {topPlayer && (
            <OpponentSeat
              player={topPlayer}
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMovesOpen(true)}
        aria-label="Registro de jogadas"
        className="absolute right-0 top-1/2 z-20 flex h-16 w-9 -translate-y-1/2 items-center justify-center rounded-l-2xl border-[3px] border-r-0 border-[#3D291F] bg-[#A9C938] text-[#3D291F]"
      >
        <ChevronRight
          size={22}
          strokeWidth={3}
        />
      </button>

      <footer className="relative z-10 flex items-end justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="h-14 w-14 rounded-xl border-[3px] border-[#3D291F] bg-[#A9C938]" />

            <span className="rounded-full bg-[#4A3525] px-3 py-0.5 text-xs font-bold text-white">
              {myPlayer?.username ?? "Você"}
            </span>
          </div>

          <button
            type="button"
            aria-label="Enviar emote"
            className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#3D291F] bg-[#FFF200] text-[#3D291F] shadow-[0_4px_0_#3D291F] active:translate-y-1"
          >
            <Smile size={26} />
          </button>
        </div>

        <div className="flex max-w-[60vw] items-end gap-2 overflow-x-auto px-2 pb-3 pt-6">
          {myPlayer?.hand.cards.map(
            (card) => (
              <PlayingCard
                key={card.id}
                card={card}
                onClick={() =>
                  playCard(card.id)
                }
                disabled={!isMyTurn}
              />
            ),
          )}
        </div>

        <button
          type="button"
          onClick={sayUno}
          disabled={
            !isMyTurn ||
            myPlayer?.hand.cards.length !== 1
          }
          className="mb-2 flex h-24 w-24 items-center justify-center rounded-full border-[5px] border-[#3D291F] bg-[#ED1C24] font-display text-2xl text-white shadow-[0_7px_0_#3D291F] transition active:translate-y-1 active:shadow-[0_2px_0_#3D291F] disabled:cursor-not-allowed disabled:opacity-50"
        >
          URRO!
        </button>
      </footer>

      {movesOpen && (
        <MovesLogPanel
          onClose={() =>
            setMovesOpen(false)
          }
        />
      )}
    </main>
  );
}