import { useCallback, useEffect, useRef } from "react";
import { useSocket } from "../../shared/context/SocketContext";

const GAME_EVENTS = {
  INPUT: {
    CREATE: "game::create",
    JOIN: "game::join",
    LEAVE: "game::leave",
    READY: "game::ready",
    NOT_READY: "game::notReady",
    GET_BY_ID_INFO: "game::getByIdInfo",

    START: "game::start",
    DRAW: "game::draw",
    PLAY: "game::play",
    SAY_UNO: "game::sayUno",
    CHALLENGE_UNO: "game::challengeUno",
  },

  OUTPUT: {
    GAME_INFO: "game::info",
    JOINED: "game::joined",
    LEAVED: "game::leaved",
    ERROR: "game::error",
  },
};

export type CardColor =
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "wild";

export type CardType =
  | "number"
  | "skip"
  | "reverse"
  | "draw_two"
  | "wild"
  | "wild_draw_four";

export type GameCard = {
  id: string;
  type: CardType;
  color: CardColor;
  value: string | number | null;
};

export type GamePlayer = {
  player: string;
  username: string;
  ready: boolean;
  isBot: boolean;
  saidUno: boolean;
  score: number;

  hand: {
    cards: GameCard[];
  };
};

export type GameInfo = {
  id: string;
  title: string;
  code: string;
  status: string;

  owner: string;

  currentPlayer: string | null;

  maxPlayers: number;

  players: GamePlayer[];

  deck: GameCard[];

  discard: GameCard[];

  direction: number;

  activeColor: CardColor | null;

  unoChallengePlayer: string | null;
};

type UseGameSocketOptions = {
  onGameInfo?: (game: GameInfo) => void;

  onJoined?: () => void;

  onLeaved?: () => void;

  onError?: (message: string) => void;
};

export function useGameSocket(
  options: UseGameSocketOptions = {},
) {
  const { socket } = useSocket();

  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    function handleGameInfo(game: GameInfo) {
      console.log(
        "[GAME SOCKET] GAME INFO:",
        game,
      );

      optionsRef.current.onGameInfo?.(game);
    }

    function handleJoined() {
      console.log(
        "[GAME SOCKET] JOINED",
      );

      optionsRef.current.onJoined?.();
    }

    function handleLeaved() {
      console.log(
        "[GAME SOCKET] LEAVED",
      );

      optionsRef.current.onLeaved?.();
    }

    function handleError(
      data: { message: string },
    ) {
      console.error(
        "[GAME SOCKET] ERROR:",
        data.message,
      );

      optionsRef.current.onError?.(
        data.message,
      );
    }

    socket.on(
      GAME_EVENTS.OUTPUT.GAME_INFO,
      handleGameInfo,
    );

    socket.on(
      GAME_EVENTS.OUTPUT.JOINED,
      handleJoined,
    );

    socket.on(
      GAME_EVENTS.OUTPUT.LEAVED,
      handleLeaved,
    );

    socket.on(
      GAME_EVENTS.OUTPUT.ERROR,
      handleError,
    );

    return () => {
      socket.off(
        GAME_EVENTS.OUTPUT.GAME_INFO,
        handleGameInfo,
      );

      socket.off(
        GAME_EVENTS.OUTPUT.JOINED,
        handleJoined,
      );

      socket.off(
        GAME_EVENTS.OUTPUT.LEAVED,
        handleLeaved,
      );

      socket.off(
        GAME_EVENTS.OUTPUT.ERROR,
        handleError,
      );
    };
  }, [socket]);

  const createRoom = useCallback(
    (data: {
      title: string;
      maxPlayers: number;
      password: string;
    }) => {
      socket?.emit(
        GAME_EVENTS.INPUT.CREATE,
        data,
      );
    },
    [socket],
  );

  const joinRoom = useCallback(
    (
      gameId: string,
      password = "",
    ) => {
      socket?.emit(
        GAME_EVENTS.INPUT.JOIN,
        {
          gameId,
          password,
        },
      );
    },
    [socket],
  );

  const leaveRoom = useCallback(() => {
    socket?.emit(
      GAME_EVENTS.INPUT.LEAVE,
    );
  }, [socket]);

  const setReady = useCallback(() => {
    socket?.emit(
      GAME_EVENTS.INPUT.READY,
    );
  }, [socket]);

  const setNotReady = useCallback(() => {
    socket?.emit(
      GAME_EVENTS.INPUT.NOT_READY,
    );
  }, [socket]);

  const getGameInfo = useCallback(
  (gameId: string) => {
    socket?.emit(
      GAME_EVENTS.INPUT.GET_BY_ID_INFO,
      { gameId },
    );
  },
  [socket],
);

  const startGame = useCallback(() => {
    console.log("[GAME SOCKET] START");
    socket?.emit(
      GAME_EVENTS.INPUT.START,
    );
  }, [socket]);

  const drawCard = useCallback(() => {
    socket?.emit(
      GAME_EVENTS.INPUT.DRAW,
    );
  }, [socket]);

  const playCard = useCallback(
    (
      cardId: string,
      colorChoice?: CardColor,
    ) => {
      socket?.emit(
        GAME_EVENTS.INPUT.PLAY,
        {
          cardId,
          colorChoice,
        },
      );
    },
    [socket],
  );

  const sayUno = useCallback(() => {
    socket?.emit(
      GAME_EVENTS.INPUT.SAY_UNO,
    );
  }, [socket]);

  const challengeUno = useCallback(() => {
    socket?.emit(
      GAME_EVENTS.INPUT.CHALLENGE_UNO,
    );
  }, [socket]);

 

  return {
    createRoom,
    joinRoom,
    leaveRoom,

    setReady,
    setNotReady,

    getGameInfo,

    startGame,

    drawCard,
    playCard,

    sayUno,
    challengeUno,

   
  };
}