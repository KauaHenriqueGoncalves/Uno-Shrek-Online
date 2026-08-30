import { useEffect, useMemo, useState } from "react";
import { Settings } from "lucide-react";

import background from "../../../assets/game-bg.png";
import emoteButton from "../../../assets/emote-button.svg";
import urroButton from "../../../assets/urro-button.svg";

import { CardBack, PlayingCard } from "./PlayingCard";
import { OpponentSeat, type Opponent } from "./OpponentSeat";
import { MovesLogPanel } from "./MovesLogPanel";
import { ColorPickerModal } from "../../shared/components/ColorPickerModal";

import {
  useGameSocket,
  type GamePlayer,
  type GameInfo,
  type GameCard,
} from "./useGameSocket";

import { useAuth } from "../../shared/context/AuthContext";

export function GameScreen() {
  const { user } = useAuth();

  const [movesOpen, setMovesOpen] = useState(false);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedWildCard, setSelectedWildCard] = useState<string | null>(null);

  const gameId = sessionStorage.getItem("currentGameId");

  const { getGameInfo, drawCard, playCard, sayUno } = useGameSocket({
    onGameInfo: (gameData) => {
      console.log("[GAME SCREEN] Game updated:", gameData);

      setGame(gameData);
      setError(null);
    },

    onError: (message) => {
      console.error("[GAME SCREEN] Error:", message);

      setError(message);
    },
  });

  useEffect(() => {
    if (!gameId) {
      setError("Partida não encontrada.");
      return;
    }

    getGameInfo(gameId);
  }, [gameId, getGameInfo]);

  const myPlayer = useMemo(() => {
    if (!game || !user) {
      return null;
    }

    return game.players.find((player) => player.player === user.id) ?? null;
  }, [game, user]);

  const opponents = useMemo(() => {
    if (!game || !myPlayer) {
      return [];
    }

    return game.players.filter((player) => player.player !== myPlayer.player);
  }, [game, myPlayer]);

  const currentPlayer = useMemo(() => {
    if (!game) {
      return null;
    }

    return (
      game.players.find((player) => player.player === game.currentPlayer) ??
      null
    );
  }, [game]);

  

  const discardCard = useMemo(() => {
    if (!game?.discard?.length) {
      return null;
    }

    return game.discard[game.discard.length - 1];
  }, [game]);

  const isMyTurn = myPlayer?.player === game?.currentPlayer;

  const clockwise = game?.direction !== -1;

  const activeColorConfig = {
    red: {
      label: "VERMELHO",
      color: "#E23E3E",
    },

    green: {
      label: "VERDE",
      color: "#91BE38",
    },

    blue: {
      label: "AZUL",
      color: "#18A5D6",
    },

    yellow: {
      label: "AMARELO",
      color: "#FFC107",
    },
  };

  const currentColor =
    game?.activeColor && game.activeColor !== "wild"
      ? activeColorConfig[game.activeColor]
      : null;

  const handleCardClick = (card: GameCard) => {
    if (card.type === "wild" || card.type === "wild_draw_four") {
      setSelectedWildCard(card.id);
      setColorPickerOpen(true);

      return;
    }

    playCard(card.id);
  };

  function convertOpponent(player?: GamePlayer): Opponent | null {
    if (!player) {
      return null;
    }

    return {
      id: player.player,
      name: player.username,
      cards: player.hand.cards.length,
      active: player.player === game?.currentPlayer,
    };
  }

  /*
   * Distribuição visual:
   *
   * opponents[0] -> topo
   * opponents[1] -> esquerda
   * opponents[2] -> direita
   */
  const topPlayer = convertOpponent(opponents[0]);
  const leftPlayer = convertOpponent(opponents[1]);
  const rightPlayer = convertOpponent(opponents[2]);

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* BACKGROUND */}
      <img
        src={background}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/45" />

      {/* HEADER */}
      <header className="relative z-10 flex items-start justify-between p-4">
        {/* O backend atual não envia tempo da partida */}
        <div className="rounded-full border-[3px] border-[#3D291F] bg-[#FAEFDD] px-5 py-2">
          <span className="font-display text-xl text-[#3D291F]">--:--</span>
        </div>

        <div className="mt-1 rounded-full border-[3px] border-[#3D291F] bg-[#FFF200] px-5 py-1.5 font-display text-base text-[#3D291F]">
          {currentPlayer ? `Vez de ${currentPlayer.username}` : "Aguardando..."}
        </div>

        <button
          type="button"
          aria-label="Configurações"
          className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#4A3525] bg-[#A9C938] text-[#3D291F] shadow-[0_4px_0_#3D291F] active:translate-y-1"
        >
          <Settings size={22} />
        </button>
      </header>

      {/* ERRO */}
      {error && (
        <div className="absolute left-1/2 top-24 z-50 -translate-x-1/2 rounded-xl border-2 border-[#3D291F] bg-[#ED1C24] px-5 py-3 text-sm font-bold text-white">
          {error}
        </div>
      )}

      {/* JOGADORES LATERAIS + MESA */}
      <div className="relative z-10 flex flex-1 items-center justify-between px-4">
        {/* JOGADOR DA ESQUERDA */}
        <div className="w-[120px]">
          {leftPlayer && <OpponentSeat player={leftPlayer} />}
        </div>

        {/* CENTRO DA MESA */}
        <div className="relative flex items-center justify-center">
          {/* INDICADOR DE DIREÇÃO */}
          <div
            className={`
              absolute
              h-[320px]
              w-[320px]
              rounded-full
              border-[6px]
              border-dashed
              border-[#FAEFDD]/80
              sm:h-[380px]
              sm:w-[380px]
              ${
                clockwise
                  ? "animate-[spin_18s_linear_infinite]"
                  : "animate-[spin_18s_linear_infinite_reverse]"
              }
            `}
          />
          {/* COR ATUAL */}
          {currentColor && (
            <div className="absolute top-50 left-1/2 z-20 -translate-x-1/2">
              <div className="flex flex-col items-center">
                {/* Texto */}
                <div className="mb-2 rounded-full border-[3px] border-[#3D291F] bg-[#FAEFDD] px-4 py-1 shadow-[0_3px_0_#3D291F]">
                  <span className="font-display text-sm text-[#3D291F]">
                    COR ATUAL
                  </span>
                </div>

                {/* Cor */}
                <div className="flex items-center gap-2 rounded-full border-[3px] border-[#3D291F] bg-[#FAEFDD] px-4 py-2 shadow-[0_4px_0_#3D291F]">
                  {/* Bolinha da cor */}
                  <div
                    className="h-6 w-6 rounded-full border-[2px] border-[#3D291F]"
                    style={{
                      backgroundColor: currentColor.color,
                    }}
                  />

                  {/* Nome */}
                  <span className="font-display text-sm text-[#3D291F]">
                    {currentColor.label}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* MONTE + DESCARTE */}
          <div className="relative flex items-center gap-5">
            <CardBack onClick={drawCard} disabled={!isMyTurn} />

            {discardCard && (
              <PlayingCard
                card={discardCard}
                className="rotate-6 hover:translate-y-0"
                disabled
              />
            )}
          </div>
        </div>

        {/* JOGADOR DA DIREITA */}
        <div className="flex w-[120px] justify-end">
          {rightPlayer && <OpponentSeat player={rightPlayer} />}
        </div>
      </div>

      {/* JOGADOR DO TOPO */}
      <div className="pointer-events-none absolute left-0 right-0 top-16 z-10 flex justify-center">
        <div className="pointer-events-auto">
          {topPlayer && <OpponentSeat player={topPlayer} />}
        </div>
      </div>

      {/* BOTÃO DE JOGADAS */}
      <button
        type="button"
        onClick={() => setMovesOpen(true)}
        aria-label="Registro de jogadas"
        className="absolute right-0 top-1/2 z-20 flex h-16 w-10 -translate-y-1/2 items-center justify-center rounded-l-2xl border-[3px] border-r-0 border-[#3D291F] bg-[#A9C938] text-xl font-bold text-[#3D291F]"
      >
        ❯
      </button>

      {/* ÁREA INFERIOR */}
      <div className="relative z-20 flex items-end justify-between px-6 pb-4">
        {/* JOGADOR + EMOTE */}
        <div className="flex items-end gap-3">
          {/* JOGADOR ATUAL */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`
                h-14
                w-14
                rounded-xl
                border-[3px]
                border-[#3D291F]
                bg-[#A9C938]
                ${isMyTurn ? "shadow-[0_0_18px_6px_#ED1C24]" : ""}
              `}
            />

            <span className="max-w-[140px] truncate rounded-full bg-[#4A3525] px-3 py-0.5 text-xs font-bold text-white">
              {myPlayer?.username ?? user?.username ?? "Você"}
            </span>
          </div>

          {/* BOTÃO DE EMOTE */}
          <button
            type="button"
            onClick={() => {
              // Ainda não existe evento real de emote no backend
            }}
            aria-label="Enviar emote"
            className="transition active:translate-y-1"
          >
            <img
              src={emoteButton}
              alt="Enviar emote"
              className="h-[62px] w-[62px]"
            />
          </button>
        </div>

        {/* BOTÃO URRO */}
        <button
          type="button"
          onClick={sayUno}
          disabled={!isMyTurn || myPlayer?.hand.cards.length !== 1}
          aria-label="Gritar URRO"
          className="transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <img src={urroButton} alt="URRO" className="h-[120px] w-[120px]" />
        </button>
      </div>

      {/* MÃO DO JOGADOR */}
      <footer className="pointer-events-none relative z-20 flex h-[110px] items-end justify-center">
        <div className="pointer-events-auto flex max-w-full items-end gap-2 overflow-x-auto px-4 pb-2 pt-6">
          {myPlayer?.hand.cards.map((card) => (
            <PlayingCard
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card)}
              disabled={!isMyTurn}
            />
          ))}
        </div>
      </footer>

      {/* PAINEL DE JOGADAS */}
      {movesOpen && (
        <MovesLogPanel onClose={() => setMovesOpen(false)} moves={[]} />
      )}

      {/* MODAL PARA ESCOLHER A COR */}
      {colorPickerOpen && selectedWildCard && (
        <ColorPickerModal
          onSelect={(color) => {
            playCard(selectedWildCard, color);

            setColorPickerOpen(false);
            setSelectedWildCard(null);
          }}
        />
      )}
    </main>
  );
}
