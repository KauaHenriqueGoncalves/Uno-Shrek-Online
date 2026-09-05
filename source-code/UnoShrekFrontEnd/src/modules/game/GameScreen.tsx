import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Settings } from "lucide-react";

import background from "../../../assets/game-bg.png";
import emoteButton from "../../../assets/emote-button.svg";
import urroButton from "../../../assets/urro-button.svg";
import shrekS from "../../../assets/emotes/shrekS-4x.png";
import shrekPls from "../../../assets/emotes/shrekPls-4x.gif";
import shrekBabyDancing from "../../../assets/emotes/ShrekBabyDancing-4x.gif";
import rizz from "../../../assets/emotes/RIZZ-4x.gif";
import please from "../../../assets/emotes/please-4x.gif";
import donkey from "../../../assets/emotes/Donkey-4x.png";

import { CardBack, PlayingCard } from "./PlayingCard";
import { OpponentSeat, type Opponent } from "./OpponentSeat";
import { MovesLogPanel, type MoveLogItem } from "./MovesLogPanel";
import { ColorPickerModal } from "../../shared/components/ColorPickerModal";
import { ReconnectionBanner } from "../../shared/components/ReconnectionBanner";
import { GameOverBanner } from "../../shared/components/Gameoverbanner";
import { SettingsModal } from "../../shared/components/SettingsModal";

import { useReconnection } from "../../shared/hooks/useReconnection";
import { useSocket } from "../../shared/context/SocketContext";
import { useNavigate } from "@tanstack/react-router";
import { resolveAvatar } from "../../shared/utils/avatar";

import { getCardImage } from "./cardAssets";

import {
  useGameSocket,
  type GamePlayer,
  type GameInfo,
  type GameCard,
  type HistoryItem,
} from "./useGameSocket";

import { useAuth } from "../../shared/context/AuthContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

const COLOR_LABEL: Record<string, string> = {
  red: "Vermelho",
  blue: "Azul",
  green: "Verde",
  yellow: "Amarelo",
  wild: "Coringa",
};

const TYPE_LABEL: Record<string, string> = {
  skip: "Pular",
  reverse: "Inverter",
  draw_two: "+2",
  wild: "Coringa",
  wild_draw_four: "+4",
};

const EMOTES = [
  { key: 1, name: "Shrek ", image: shrekS },
  { key: 2, name: "Dança", image: shrekPls },
  { key: 3, name: "Dancinha", image: shrekBabyDancing },
  { key: 4, name: "Rizz", image: rizz },
  { key: 5, name: "😭", image: please },
  { key: 6, name: "Burro", image: donkey },
] as const;

type ActiveEmote = {
  key: number;
  playerId: string;
  nonce: number;
};

function formatAction(h: HistoryItem): string {
  if (h.action === "draw") return "Comprou uma carta";
  if (h.action === "sayUno") return "Disse URRO! 🎉";

  if (h.action === "play" && h.card) {
    const color = COLOR_LABEL[h.card.color] ?? h.card.color;

    const type =
      h.card.type === "number"
        ? String(h.card.value ?? "")
        : (TYPE_LABEL[h.card.type] ?? h.card.type);

    return `Jogou ${color} ${type}`.trim();
  }

  return h.action;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GameScreen() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const reconnection = useReconnection();

  const [movesOpen, setMovesOpen] = useState(false);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedWildCard, setSelectedWildCard] = useState<string | null>(
    null,
  );
  const [gameFinishedByInactivity, setGameFinishedByInactivity] =
    useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [emoteMenuOpen, setEmoteMenuOpen] = useState(false);
  const [activeEmotes, setActiveEmotes] = useState<ActiveEmote[]>([]);

  // ── Animações da mão ─────────────────────────────────────────────────────

  const previousHandIdsRef = useRef<Set<string>>(new Set());

  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handSlotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const previousHandRectsRef = useRef<
    Record<
      string,
      {
        x: number;
        y: number;
      }
    >
  >({});

  // ── Carta voando para o descarte ─────────────────────────────────────────

  const [flyingCard, setFlyingCard] = useState<{
    card: GameCard;
    from: {
      x: number;
      y: number;
    };
    to: {
      x: number;
      y: number;
    };
  } | null>(null);

  // ── Carta do adversário voando ───────────────────────────────────────────

  const [flyingOpponentCard, setFlyingOpponentCard] = useState<{
    card: GameCard;
    from: {
      x: number;
      y: number;
    };
    to: {
      x: number;
      y: number;
    };
    rotation: number;
  } | null>(null);

  const opponentSeatRefs = useRef<
    Record<string, HTMLDivElement | null>
  >({});

  const previousOpponentCountsRef = useRef<Record<string, number>>({});

  const lastHistoryIdRef = useRef<string | null>(null);

  // ── Descarte ─────────────────────────────────────────────────────────────

  const [discardImpact, setDiscardImpact] = useState(false);

  const discardRef = useRef<HTMLDivElement | null>(null);

  // ── Detecta cartas novas ─────────────────────────────────────────────────

  const detectNewCards = (cards: GameCard[]) => {
    const currentIds = new Set(cards.map((card) => card.id));

    /*
     * Primeira sincronização.
     *
     * As cartas iniciais da partida não são cartas "compradas",
     * então não devem executar a animação de entrada.
     */
    if (previousHandIdsRef.current.size === 0) {
      previousHandIdsRef.current = currentIds;
      return;
    }

    const addedIds = new Set<string>();

    for (const id of currentIds) {
      if (!previousHandIdsRef.current.has(id)) {
        addedIds.add(id);
      }
    }

    previousHandIdsRef.current = currentIds;

    if (addedIds.size === 0) {
      return;
    }

    setNewCardIds(addedIds);

    window.setTimeout(() => {
      setNewCardIds((current) => {
        const next = new Set(current);

        for (const id of addedIds) {
          next.delete(id);
        }

        return next;
      });
    }, 500);
  };

  // ── Captura posições da mão antes da atualização ─────────────────────────

  const captureHandPositions = () => {
    const positions: Record<
      string,
      {
        x: number;
        y: number;
      }
    > = {};

    for (const [cardId, element] of Object.entries(handSlotRefs.current)) {
      if (!element) continue;

      const rect = element.getBoundingClientRect();

      positions[cardId] = {
        x: rect.left,
        y: rect.top,
      };
    }

    previousHandRectsRef.current = positions;
  };

  // ── FLIP da mão ──────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    const previousPositions = previousHandRectsRef.current;

    if (Object.keys(previousPositions).length === 0) {
      return;
    }

    for (const [cardId, element] of Object.entries(handSlotRefs.current)) {
      if (!element) continue;

      const previous = previousPositions[cardId];

      /*
       * Se a carta não existia antes, ela é uma carta nova.
       * A animação dela é controlada pelo `card-enter`.
       */
      if (!previous) {
        continue;
      }

      const current = element.getBoundingClientRect();

      const deltaX = previous.x - current.left;
      const deltaY = previous.y - current.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        continue;
      }

      element.animate(
        [
          {
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0)`,
          },
          {
            transform: "translate3d(0, 0, 0)",
          },
        ],
        {
          duration: 280,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          fill: "none",
        },
      );
    }

    previousHandRectsRef.current = {};
  }, [game?.players]);

  // ── Atualiza contagem dos adversários ────────────────────────────────────

  const updateOpponentCounts = (gameData: GameInfo) => {
    const counts: Record<string, number> = {};

    for (const player of gameData.players) {
      if (player.player === user?.id) {
        continue;
      }

      counts[player.player] = player.hand.cards.length;
    }

    previousOpponentCountsRef.current = counts;
  };

  // ── Detecta jogada dos adversários ───────────────────────────────────────

  const detectOpponentPlay = (gameData: GameInfo) => {
    const histories = gameData.histories ?? [];

    const latestHistory = histories[histories.length - 1];

    if (!latestHistory) {
      return;
    }

    /*
     * Primeira sincronização:
     * não reproduzimos as jogadas antigas.
     */
    if (lastHistoryIdRef.current === null) {
      lastHistoryIdRef.current = latestHistory.id;
      return;
    }

    /*
     * A mesma jogada já foi processada.
     */
    if (lastHistoryIdRef.current === latestHistory.id) {
      return;
    }

    lastHistoryIdRef.current = latestHistory.id;

    /*
     * Só queremos animar uma carta quando alguém joga.
     */
    if (
      latestHistory.action !== "play" ||
      !latestHistory.card ||
      latestHistory.player === user?.id
    ) {
      return;
    }

    const opponent = gameData.players.find(
      (player) => player.player === latestHistory.player,
    );

    if (!opponent) {
      return;
    }

    const previousCount =
      previousOpponentCountsRef.current[opponent.player];

    const currentCount = opponent.hand.cards.length;

    /*
     * Se não temos uma quantidade anterior,
     * não temos como confirmar que uma carta foi removida.
     */
    if (previousCount === undefined) {
      return;
    }

    /*
     * Se a quantidade não diminuiu, não é uma jogada normal
     * que removeu uma carta da mão.
     */
    if (currentCount >= previousCount) {
      return;
    }

    const source = opponentSeatRefs.current[opponent.player];
    const target = discardRef.current;

    if (!source || !target) {
      return;
    }

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const from = {
      x: sourceRect.left + sourceRect.width / 2,
      y: sourceRect.top + sourceRect.height / 2,
    };

    const to = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2,
    };

    /*
     * A carta vem da direção do jogador.
     *
     * Isso dá uma pequena diferença visual entre:
     * top / left / right.
     */
    const isTop = opponent.player === opponentPositions.top?.id;
    const isLeft = opponent.player === opponentPositions.left?.id;
    const isRight = opponent.player === opponentPositions.right?.id;

    let rotation = 0;

    if (isTop) {
      rotation = -8;
    } else if (isLeft) {
      rotation = 8;
    } else if (isRight) {
      rotation = -8;
    }

    const card: GameCard = {
      id: latestHistory.card.id,
      type: latestHistory.card.type as GameCard["type"],
      color: latestHistory.card.color as GameCard["color"],
      value: latestHistory.card.value,
    };

    setFlyingOpponentCard({
      card,
      from,
      to,
      rotation,
    });

    window.setTimeout(() => {
      setFlyingOpponentCard(null);

      setDiscardImpact(true);

      window.setTimeout(() => {
        setDiscardImpact(false);
      }, 350);
    }, 420);
  };

  const gameId = sessionStorage.getItem("currentGameId");

  // ── Sair da partida ──────────────────────────────────────────────────────

  const handleLeaveGame = () => {
    leaveRoom();
    sessionStorage.removeItem("currentGameId");

    navigate({
      to: "/home",
    });
  };

  // ── Socket: game::finished (inatividade) ─────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    function handleFinished() {
      setGameFinishedByInactivity(true);
    }

    socket.on("game::finished", handleFinished);

    return () => {
      socket.off("game::finished", handleFinished);
    };
  }, [socket]);

  // ── Game socket ───────────────────────────────────────────────────────────

  const {
    getGameInfo,
    drawCard,
    playCard,
    sayUno,
    challengeUno,
    leaveRoom,
    sendEmote,
  } = useGameSocket({
    onGameInfo: (gameData) => {
      /*
       * IMPORTANTE:
       *
       * Capturamos a posição da mão antes de `setGame`.
       * Assim o FLIP consegue comparar:
       *
       * posição antiga → posição nova.
       */
      captureHandPositions();

      const player = user
        ? gameData.players.find((p) => p.player === user.id)
        : null;

      if (player) {
        detectNewCards(player.hand.cards);
      }

      /*
       * Detectamos a jogada do adversário ANTES de atualizar
       * os contadores anteriores.
       */
      detectOpponentPlay(gameData);

      /*
       * Depois de detectar, salvamos as novas quantidades.
       */
      updateOpponentCounts(gameData);

      setGame(gameData);
      setError(null);
      setActionLoading(false);
    },

    onError: (message) => {
      setError(message);
      setActionLoading(false);
    },
    onEmote: ({ key, playerId }) => {
      setActiveEmotes((current) => [
        ...current.filter((emote) => emote.playerId !== playerId),
        { key, playerId, nonce: Date.now() },
      ]);

      window.setTimeout(() => {
        setActiveEmotes((current) =>
          current.filter((emote) => emote.playerId !== playerId),
        );
      }, 3500);
    },
  });

  const getActiveEmote = (playerId?: string | null) =>
    activeEmotes.find((emote) => emote.playerId === playerId);

  const getEmoteImage = (key?: number) =>
    EMOTES.find((emote) => emote.key === key)?.image;

  const getEmoteName = (key?: number) =>
    EMOTES.find((emote) => emote.key === key)?.name;

  useEffect(() => {
    if (!gameId) {
      setError("Partida não encontrada.");
      return;
    }

    getGameInfo(gameId);
  }, [gameId, getGameInfo]);

  // ── Derivados ─────────────────────────────────────────────────────────────

  const myPlayer = useMemo(() => {
    if (!game || !user) return null;

    return (
      game.players.find((p) => p.player === user.id) ?? null
    );
  }, [game, user]);

  const myAvatar = resolveAvatar(
    myPlayer?.picture,
    myPlayer?.avatarKey,
  );

  const winner = useMemo(
    () =>
      game?.status === "finished" && game.winner
        ? (() => {
            const winnerPlayer = game.players.find(
              (player) => player.player === game.winner,
            );

            return winnerPlayer
              ? {
                  username: winnerPlayer.username,
                  avatar: resolveAvatar(
                    winnerPlayer.picture,
                    winnerPlayer.avatarKey,
                  ),
                }
              : null;
          })()
        : null,
    [game],
  );

  // ── Ordem relativa dos adversários ───────────────────────────────────────

  const relativeOpponents = useMemo(() => {
    if (!game || !myPlayer) return [];

    const myIndex = game.players.findIndex(
      (p) => p.player === myPlayer.player,
    );

    if (myIndex === -1) return [];

    const ordered: GamePlayer[] = [];

    for (
      let offset = 1;
      offset < game.players.length;
      offset++
    ) {
      ordered.push(
        game.players[
          (myIndex + offset) % game.players.length
        ],
      );
    }

    return ordered;
  }, [game, myPlayer]);

  const currentPlayer = useMemo(() => {
    if (!game) return null;

    return (
      game.players.find(
        (p) => p.player === game.currentPlayer,
      ) ?? null
    );
  }, [game]);

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const startedAtValue = game?.startedAt;

    if (!startedAtValue) {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      const startedAt = Date.parse(startedAtValue);

      setElapsedSeconds(
        Number.isNaN(startedAt)
          ? 0
          : Math.max(
              0,
              Math.floor(
                (Date.now() - startedAt) / 1000,
              ),
            ),
      );
    };

    updateElapsed();

    const timer = window.setInterval(
      updateElapsed,
      1000,
    );

    return () => window.clearInterval(timer);
  }, [game?.startedAt]);

  // ── Descarte ─────────────────────────────────────────────────────────────

  const discardCard = useMemo(() => {
    if (!game?.discard?.length) return null;

    return game.discard[game.discard.length - 1];
  }, [game]);

  // ── Histórico ─────────────────────────────────────────────────────────────

  const moves = useMemo<MoveLogItem[]>(() => {
    if (!game?.histories?.length) return [];

    const startedAt = game.startedAt ? Date.parse(game.startedAt) : NaN;

    const formatElapsedTime = (createdAt: string) => {
      const actionAt = Date.parse(createdAt);
      const elapsed = Number.isNaN(startedAt) || Number.isNaN(actionAt)
        ? 0
        : Math.max(0, Math.floor((actionAt - startedAt) / 1000));

      return `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
    };

    return [...game.histories]
      .reverse()
      .map((h) => {
        const player = game.players.find((gamePlayer) => gamePlayer.player === h.player);

        return {
          id: h.id,
          player: h.username,
          text: formatAction(h),
          avatar: resolveAvatar(player?.picture, player?.avatarKey),
          color: h.action === "play" && h.card && h.card.color !== "wild"
            ? h.card.color as "red" | "blue" | "green" | "yellow"
            : undefined,
          elapsedTime: formatElapsedTime(h.createdAt),
        };
      });
  }, [game?.histories, game?.players, game?.startedAt]);

  // ── Flags ─────────────────────────────────────────────────────────────────

  const isMyTurn =
    myPlayer?.player === game?.currentPlayer;

  const canSayUno = Boolean(
    myPlayer &&
      myPlayer.hand.cards.length === 1 &&
      game?.unoChallengePlayer === myPlayer.player,
  );

  const canChallengeUno = Boolean(
    myPlayer &&
      game?.unoChallengePlayer &&
      game.unoChallengePlayer !== myPlayer.player,
  );

  const clockwise = game?.direction !== -1;

  const elapsedMinutes = Math.floor(
    elapsedSeconds / 60,
  );

  const elapsedDisplay = `${String(
    elapsedMinutes,
  ).padStart(2, "0")}:${String(
    elapsedSeconds % 60,
  ).padStart(2, "0")}`;

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
    game?.activeColor &&
    game.activeColor !== "wild"
      ? activeColorConfig[
          game.activeColor as keyof typeof activeColorConfig
        ]
      : null;

  // ── Posições dos adversários ──────────────────────────────────────────────

  function convertOpponent(
    player?: GamePlayer,
  ): Opponent | null {
    if (!player) return null;

    return {
      id: player.player,
      name: player.username,
      avatar: resolveAvatar(
        player.picture,
        player.avatarKey,
      ),
      cards: player.hand.cards.length,
      active:
        player.player === game?.currentPlayer,
    };
  }

  const opponentPositions = useMemo(() => {
    const positions = {
      top: null as Opponent | null,
      left: null as Opponent | null,
      right: null as Opponent | null,
    };

    const converted = relativeOpponents.map((p) =>
      convertOpponent(p),
    );

    if (converted.length === 1) {
      positions.top = converted[0];
    }

    if (converted.length === 2) {
      positions.left = converted[0];
      positions.right = converted[1];
    }

    if (converted.length === 3) {
      positions.top = converted[0];
      positions.left = converted[1];
      positions.right = converted[2];
    }

    return positions;
  }, [relativeOpponents, game]);

  const {
    top: topPlayer,
    left: leftPlayer,
    right: rightPlayer,
  } = opponentPositions;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDrawCard = () => {
    if (actionLoading || !isMyTurn) return;

    setActionLoading(true);
    drawCard();
  };

  // ── Animação: sua carta → descarte ────────────────────────────────────────

  const animateCardToDiscard = (
    card: GameCard,
  ) => {
    const source = cardRefs.current[card.id];
    const target = discardRef.current;

    if (!source || !target) {
      setSelectedCardId(null);
      return;
    }

    const sourceRect =
      source.getBoundingClientRect();

    const targetRect =
      target.getBoundingClientRect();

    const sourceCenter = {
      x:
        sourceRect.left +
        sourceRect.width / 2,
      y:
        sourceRect.top +
        sourceRect.height / 2,
    };

    const targetCenter = {
      x:
        targetRect.left +
        targetRect.width / 2,
      y:
        targetRect.top +
        targetRect.height / 2,
    };

    setFlyingCard({
      card,
      from: sourceCenter,
      to: targetCenter,
    });

    setSelectedCardId(null);

    window.setTimeout(() => {
      setFlyingCard(null);

      setDiscardImpact(true);

      window.setTimeout(() => {
        setDiscardImpact(false);
      }, 350);
    }, 420);
  };

  // ── Clique na carta ───────────────────────────────────────────────────────

  const handleCardClick = (
    card: GameCard,
  ) => {
    if (actionLoading || !isMyTurn) return;

    /*
     * Primeiro mostramos a carta selecionada.
     */
    setSelectedCardId(card.id);

    /*
     * Coringas precisam aguardar a escolha da cor.
     */
    if (
      card.type === "wild" ||
      card.type === "wild_draw_four"
    ) {
      setSelectedWildCard(card.id);
      setColorPickerOpen(true);
      return;
    }

    setActionLoading(true);

    /*
     * Esperamos o próximo frame para que o estado
     * de seleção seja renderizado antes do voo.
     */
    requestAnimationFrame(() => {
      animateCardToDiscard(card);
    });

    playCard(card.id);
  };

  const handleSayUno = () => {
    if (actionLoading || !canSayUno) return;

    setActionLoading(true);
    sayUno();
  };

  const handleChallengeUno = () => {
    if (
      actionLoading ||
      !canChallengeUno
    ) {
      return;
    }

    setActionLoading(true);
    challengeUno();
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (!game) {
    return (
      <main
        className="relative min-h-screen overflow-hidden"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
          <div className="flex flex-col items-center gap-4 rounded-3xl border-[4px] border-[#3D291F] bg-[#FAEFDD] px-10 py-8 shadow-[0_8px_0_#3D291F]">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#91BE38] border-t-[#3D291F]" />

            <div className="text-center">
              <h2 className="font-display text-2xl text-[#3D291F]">
                CARREGANDO PARTIDA
              </h2>

              <p className="mt-2 font-bold text-[#8A7A63]">
                Aguarde enquanto preparamos a mesa...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden">
      <img
        src={background}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/45" />

      {/* EMOTES ATIVOS */}
      {[
        { playerId: leftPlayer?.id, position: "left-28 top-1/2 -translate-y-1/2" },
        { playerId: rightPlayer?.id, position: "right-28 top-1/2 -translate-y-1/2" },
        { playerId: topPlayer?.id, position: "left-1/2 top-20 -translate-x-1/2" },
        { playerId: myPlayer?.player, position: "left-28 bottom-28" },
      ].map(({ playerId, position }) => {
        const emote = getActiveEmote(playerId);
        const image = getEmoteImage(emote?.key);

        if (!emote || !image) return null;

        return (
          <div
            key={`${emote.playerId}-${emote.nonce}`}
            className={`pointer-events-none absolute z-40 animate-[winner-modal-in_220ms_ease-out] ${position}`}
          >
            <div className="relative flex h-24 w-28 items-center justify-center rounded-[22px] border-[4px] border-[#3D291F] bg-[#FAEFDD] p-2 shadow-[0_7px_0_#3D291F] after:absolute after:-bottom-4 after:left-8 after:border-x-[12px] after:border-t-[18px] after:border-x-transparent after:border-t-[#3D291F]">
              <div className="absolute -bottom-2 left-[35px] z-10 border-x-[8px] border-t-[12px] border-x-transparent border-t-[#FAEFDD]" />
              <img
                src={image}
                alt={getEmoteName(emote.key)}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        );
      })}

      {/* HEADER */}
      <header className="relative z-10 flex items-start justify-between p-4">
        <div className="rounded-full border-[3px] border-[#3D291F] bg-[#FAEFDD] px-5 py-2">
          <span className="font-display text-xl text-[#3D291F]">
            {elapsedDisplay}
          </span>
        </div>

        <div className="mt-1 rounded-full border-[3px] border-[#3D291F] bg-[#FFF200] px-5 py-1.5 font-display text-base text-[#3D291F]">
          {currentPlayer
            ? `Vez de ${currentPlayer.username}`
            : "Aguardando..."}
        </div>

        <button
          type="button"
          onClick={() =>
            setSettingsOpen(true)
          }
          aria-label="Configurações"
          title="Configurações"
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
        {/* ESQUERDA */}
        <div
          className={`w-[120px] transition-all ${
            game.players.length === 3
              ? "-translate-y-16"
              : ""
          }`}
        >
          {leftPlayer && (
            <OpponentSeat
              ref={(element) => {
                opponentSeatRefs.current[
                  leftPlayer.id
                ] = element;
              }}
              player={leftPlayer}
            />
          )}
        </div>

        {/* MESA */}
        <div className="relative flex items-center justify-center">
          <div
            className={`
              absolute h-[320px] w-[320px] rounded-full border-[6px] border-dashed border-[#FAEFDD]/80
              sm:h-[380px] sm:w-[380px]
              ${
                clockwise
                  ? "animate-[spin_18s_linear_infinite]"
                  : "animate-[spin_18s_linear_infinite_reverse]"
              }
            `}
          />

          {/* COR ATUAL */}
          {currentColor && (
            <div className="absolute left-1/2 top-50 z-20 -translate-x-1/2">
              <div className="flex flex-col items-center">
                <div className="mb-2 rounded-full border-[3px] border-[#3D291F] bg-[#FAEFDD] px-4 py-1 shadow-[0_3px_0_#3D291F]">
                  <span className="font-display text-sm text-[#3D291F]">
                    COR ATUAL
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-full border-[3px] border-[#3D291F] bg-[#FAEFDD] px-4 py-2 shadow-[0_4px_0_#3D291F]">
                  <div
                    className="h-6 w-6 rounded-full border-[2px] border-[#3D291F]"
                    style={{
                      backgroundColor:
                        currentColor.color,
                    }}
                  />

                  <span className="font-display text-sm text-[#3D291F]">
                    {currentColor.label}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MONTE + DESCARTE */}
          <div className="relative flex items-center gap-5">
            <CardBack
              onClick={handleDrawCard}
              disabled={
                !isMyTurn ||
                actionLoading
              }
            />

            {discardCard && (
              <div
                ref={discardRef}
                className={
                  discardImpact
                    ? "card-discard-impact"
                    : ""
                }
              >
                <PlayingCard
                  card={discardCard}
                  className="rotate-6 hover:translate-y-0"
                  disabled
                />
              </div>
            )}
          </div>
        </div>

        {/* DIREITA */}
        <div
          className={`flex w-[120px] justify-end transition-all ${
            game.players.length === 3
              ? "-translate-y-16"
              : ""
          }`}
        >
          {rightPlayer && (
            <OpponentSeat
              ref={(element) => {
                opponentSeatRefs.current[
                  rightPlayer.id
                ] = element;
              }}
              player={rightPlayer}
            />
          )}
        </div>
      </div>

      {/* JOGADOR DO TOPO */}
      <div className="pointer-events-none absolute left-0 right-0 top-16 z-10 flex justify-center">
        <div className="pointer-events-auto">
          {topPlayer && (
            <OpponentSeat
              ref={(element) => {
                opponentSeatRefs.current[
                  topPlayer.id
                ] = element;
              }}
              player={topPlayer}
            />
          )}
        </div>
      </div>

      {/* BOTÃO DE JOGADAS */}
      <button
        type="button"
        onClick={() =>
          setMovesOpen(true)
        }
        aria-label="Registro de jogadas"
        className="absolute right-0 top-1/2 z-20 flex h-16 w-10 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-l-2xl border-[3px] border-r-0 border-[#3D291F] bg-[#A9C938] text-[#3D291F]"
      >
        <span className="text-xl font-bold">
          ❯
        </span>

        {moves.length > 0 && (
          <span className="text-[9px] font-black leading-none">
            {moves.length}
          </span>
        )}
      </button>

      {/* ÁREA INFERIOR */}
      <div className="relative z-20 flex items-end justify-between px-6 pb-4">
        {/* JOGADOR */}
        <div className="flex items-end gap-3">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`h-14 w-14 overflow-hidden rounded-xl border-[3px] border-[#3D291F] bg-[#A9C938] ${
                isMyTurn
                  ? "shadow-[0_0_18px_6px_#ED1C24]"
                  : ""
              }`}
            >
              {myAvatar && (
                <img
                  src={myAvatar}
                  alt={
                    myPlayer?.username ??
                    user?.username ??
                    "Você"
                  }
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <span className="max-w-[140px] truncate rounded-full bg-[#4A3525] px-3 py-0.5 text-xs font-bold text-white">
              {myPlayer?.username ??
                user?.username ??
                "Você"}
            </span>
          </div>

          <div className="relative">
            {emoteMenuOpen && (
              <div className="absolute bottom-[76px] left-0 z-50 w-[270px] rounded-[24px] border-[4px] border-[#3D291F] bg-[#FAEFDD] p-3 shadow-[0_8px_0_#3D291F]">
                <div className="mb-2 text-center font-display text-base tracking-wide text-[#3D291F]">
                  EMOTES
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {EMOTES.map((emote) => (
                    <button
                      key={emote.key}
                      type="button"
                      onClick={() => {
                        sendEmote(emote.key);
                        setEmoteMenuOpen(false);
                      }}
                      title={emote.name}
                      aria-label={`Enviar emote ${emote.name}`}
                      className="flex h-[68px] flex-col items-center justify-center rounded-2xl border-[3px] border-[#A89279] bg-[#E8D9C5] p-1 transition hover:-translate-y-1 hover:border-[#3D291F] hover:bg-white active:translate-y-0"
                    >
                      <img src={emote.image} alt="" className="h-10 w-12 object-contain" />
                      <span className="mt-0.5 max-w-full truncate text-[9px] font-black text-[#3D291F]">
                        {emote.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setEmoteMenuOpen((open) => !open)}
              aria-label="Abrir emotes"
              aria-expanded={emoteMenuOpen}
              className="transition active:translate-y-1"
            >
              <img
                src={emoteButton}
                alt="Abrir emotes"
                className="h-[62px] w-[62px]"
              />
            </button>
          </div>
        </div>

        {/* CONTRA / URRO */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleChallengeUno}
            disabled={
              !canChallengeUno ||
              actionLoading
            }
            aria-label="Contra URRO"
            className="transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              width="160"
              height="160"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[120px] w-[120px]"
              role="img"
              aria-label="Contra"
            >
              <defs>
                <linearGradient
                  id="redBtn"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="#F25C54"
                  />
                  <stop
                    offset="100%"
                    stopColor="#E23E3E"
                  />
                </linearGradient>
              </defs>

              <circle
                cx="80"
                cy="90"
                r="64"
                fill="#3D291F"
              />

              <circle
                cx="80"
                cy="80"
                r="64"
                fill="url(#redBtn)"
                stroke="#3D291F"
                strokeWidth="6"
              />

              <ellipse
                cx="80"
                cy="38"
                rx="40"
                ry="12"
                fill="#FFFFFF"
                fillOpacity="0.3"
              />

              <text
                x="80"
                y="88"
                fontFamily="'Titan One', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize="22"
                fill="#FFFFFF"
                textAnchor="middle"
                letterSpacing="1"
              >
                CONTRA
              </text>
            </svg>
          </button>

          <button
            type="button"
            onClick={handleSayUno}
            disabled={
              !canSayUno ||
              actionLoading
            }
            aria-label="Gritar URRO"
            className="transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <img
              src={urroButton}
              alt="URRO"
              className="h-[120px] w-[120px]"
            />
          </button>
        </div>
      </div>

      {/* =========================================================
          CARTA DO JOGADOR VOANDO PARA O DESCARTE
          ========================================================= */}

      {flyingCard && (
        <div
          className="pointer-events-none fixed z-[200]"
          style={{
            left:
              flyingCard.from.x - 42,
            top:
              flyingCard.from.y - 62,
            width: 84,
            height: 124,

            ["--card-target-x" as string]:
              `${
                flyingCard.to.x -
                flyingCard.from.x
              }px`,

            ["--card-target-y" as string]:
              `${
                flyingCard.to.y -
                flyingCard.from.y
              }px`,

            animation:
              "card-fly-to-discard 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
          }}
        >
          <img
            src={getCardImage(
              flyingCard.card,
            )}
            alt=""
            draggable={false}
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* =========================================================
          CARTA DO ADVERSÁRIO VOANDO PARA O DESCARTE
          ========================================================= */}

      {flyingOpponentCard && (
        <div
          className="pointer-events-none fixed z-[200]"
          style={{
            left:
              flyingOpponentCard.from.x - 42,
            top:
              flyingOpponentCard.from.y - 62,
            width: 84,
            height: 124,

            ["--card-target-x" as string]:
              `${
                flyingOpponentCard.to.x -
                flyingOpponentCard.from.x
              }px`,

            ["--card-target-y" as string]:
              `${
                flyingOpponentCard.to.y -
                flyingOpponentCard.from.y
              }px`,

            ["--card-rotation" as string]:
              `${flyingOpponentCard.rotation}deg`,

            animation:
              "card-fly-from-opponent 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
          }}
        >
          <img
            src={getCardImage(
              flyingOpponentCard.card,
            )}
            alt=""
            draggable={false}
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* =========================================================
          MÃO DO JOGADOR
          ========================================================= */}

      <footer className="pointer-events-none relative z-20 flex h-[110px] items-end justify-center">
        <div className="pointer-events-auto flex max-w-full items-end gap-2 overflow-x-auto px-4 pb-2 pt-6">
          {myPlayer?.hand.cards.map(
            (card) => (
              <div
                key={card.id}
                ref={(element) => {
                  handSlotRefs.current[
                    card.id
                  ] = element;
                }}
                className="shrink-0"
              >
                <PlayingCard
                  ref={(element) => {
                    cardRefs.current[
                      card.id
                    ] = element;
                  }}
                  card={card}
                  onClick={() =>
                    handleCardClick(card)
                  }
                  disabled={
                    !isMyTurn ||
                    actionLoading
                  }
                  selected={
                    selectedCardId ===
                    card.id
                  }
                  entering={newCardIds.has(
                    card.id,
                  )}
                />
              </div>
            ),
          )}
        </div>
      </footer>

      {/* PAINEL DE JOGADAS */}
      {movesOpen && (
        <MovesLogPanel
          onClose={() =>
            setMovesOpen(false)
          }
          moves={moves}
        />
      )}

      {/* CONFIGURAÇÕES */}
      {settingsOpen && (
        <SettingsModal
          exitLabel="SAIR DA PARTIDA"
          onExit={handleLeaveGame}
          onClose={() =>
            setSettingsOpen(false)
          }
        />
      )}

      {/* MODAL DE COR */}
      {colorPickerOpen &&
        selectedWildCard && (
          <ColorPickerModal
            onSelect={(color) => {
              if (
                !selectedWildCard ||
                actionLoading
              ) {
                return;
              }

              const card =
                myPlayer?.hand.cards.find(
                  (item) =>
                    item.id ===
                    selectedWildCard,
                );

              if (!card) {
                setColorPickerOpen(false);
                setSelectedWildCard(null);
                setSelectedCardId(null);
                return;
              }

              setActionLoading(true);
              setColorPickerOpen(false);

              requestAnimationFrame(() => {
                animateCardToDiscard(card);
              });

              playCard(
                selectedWildCard,
                color,
              );

              setSelectedWildCard(null);
            }}
          />
        )}

      {/* RECONEXÃO */}
      {reconnection.status ===
        "reconnecting" && (
        <ReconnectionBanner
          secondsLeft={
            reconnection.secondsLeft
          }
        />
      )}

      {/* FIM DA PARTIDA */}
      {(reconnection.status ===
        "failed" ||
        gameFinishedByInactivity ||
        winner) && (
        <GameOverBanner
          winner={winner}
          onLeave={() =>
            navigate({
              to: "/home",
            })
          }
        />
      )}
    </main>
  );
}