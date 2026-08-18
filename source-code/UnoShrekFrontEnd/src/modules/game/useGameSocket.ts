import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "../../shared/context/SocketContext";

const GAME_EVENTS = {
  INPUT: {
    CREATE: "game::create",
    JOIN: "game::join",
    LEAVE: "game::leave",
    READY: "game::ready",
    NOT_READY: "game::notReady",
    GET_BY_ID_INFO: "game::getByIdInfo",
  },
  OUTPUT: {
    GAME_INFO: "game::info",
    JOINED: "game::joined",
    LEAVED: "game::leaved",
    ERROR: "game::error",
  },
};

type GameInfo = {
  id: string;
  title: string;
  code: string;
  status: string;
  owner: string;
  players: Array<{
    player: string;
    username: string;
    ready: boolean;
    isBot: boolean;
  }>;
  maxPlayers: number;
};

type UseGameSocketOptions = {
  onGameInfo?: (game: GameInfo) => void;
  onJoined?: () => void;
  onLeaved?: () => void;
  onError?: (message: string) => void;
};

export function useGameSocket(options: UseGameSocketOptions = {}) {
  const { socket } = useSocket();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options.onGameInfo, options.onJoined, options.onLeaved, options.onError]);

  useEffect(() => {
    if (!socket) return;

    const handleGameInfo = (game: GameInfo) => {
      console.log("[GAME SOCKET] game info received", game);
      optionsRef.current.onGameInfo?.(game);
    };

    const handleJoined = () => {
      console.log("[GAME SOCKET] game joined received");
      optionsRef.current.onJoined?.();
    };

    const handleLeaved = () => {
      console.log("[GAME SOCKET] game leaved received");
      optionsRef.current.onLeaved?.();
    };

    const handleError = ({ message }: { message: string }) => {
      console.log("[GAME SOCKET] error received", message);
      optionsRef.current.onError?.(message);
    };

    socket.on(GAME_EVENTS.OUTPUT.GAME_INFO, handleGameInfo);
    socket.on(GAME_EVENTS.OUTPUT.JOINED, handleJoined);
    socket.on(GAME_EVENTS.OUTPUT.LEAVED, handleLeaved);
    socket.on(GAME_EVENTS.OUTPUT.ERROR, handleError);

    return () => {
      socket.off(GAME_EVENTS.OUTPUT.GAME_INFO, handleGameInfo);
      socket.off(GAME_EVENTS.OUTPUT.JOINED, handleJoined);
      socket.off(GAME_EVENTS.OUTPUT.LEAVED, handleLeaved);
      socket.off(GAME_EVENTS.OUTPUT.ERROR, handleError);
    };
  }, [socket]);

  const createRoom = useCallback(
    (data: {
      title: string;
      maxPlayers: number;
      password: string;
    }) => {
      console.log("[GAME SOCKET] emitting create", data);

      socket?.emit(GAME_EVENTS.INPUT.CREATE, data);
    },
    [socket],
  );

  const joinRoom = useCallback(
    (gameId: string, password = "") => {
      console.log("[GAME SOCKET] emitting join", {
        gameId,
        password,
      });

      socket?.emit(GAME_EVENTS.INPUT.JOIN, {
        gameId,
        password,
      });
    },
    [socket],
  );

  const leaveRoom = useCallback(() => {
    socket?.emit(GAME_EVENTS.INPUT.LEAVE);
  }, [socket]);

  const setReady = useCallback(() => {
    socket?.emit(GAME_EVENTS.INPUT.READY);
  }, [socket]);

  const setNotReady = useCallback(() => {
    socket?.emit(GAME_EVENTS.INPUT.NOT_READY);
  }, [socket]);

  const getGameInfo = useCallback(() => {
    socket?.emit(GAME_EVENTS.INPUT.GET_BY_ID_INFO);
  }, [socket]);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    setNotReady,
    getGameInfo,
  };
}