import { useEffect, useCallback } from "react";
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

  useEffect(() => {
    if (!socket) return;

    if (options.onGameInfo) {
      socket.on(GAME_EVENTS.OUTPUT.GAME_INFO, options.onGameInfo);
    }
    if (options.onJoined) {
      socket.on(GAME_EVENTS.OUTPUT.JOINED, options.onJoined);
    }
    if (options.onLeaved) {
      socket.on(GAME_EVENTS.OUTPUT.LEAVED, options.onLeaved);
    }
    if (options.onError) {
      socket.on(GAME_EVENTS.OUTPUT.ERROR, ({ message }: { message: string }) =>
        options.onError!(message),
      );
    }

    return () => {
      socket.off(GAME_EVENTS.OUTPUT.GAME_INFO);
      socket.off(GAME_EVENTS.OUTPUT.JOINED);
      socket.off(GAME_EVENTS.OUTPUT.LEAVED);
      socket.off(GAME_EVENTS.OUTPUT.ERROR);
    };
  }, [socket, options]);

  const createRoom = useCallback(
    (data: { title: string; maxPlayers: number; password: string }) => {
      socket?.emit(GAME_EVENTS.INPUT.CREATE, data);
    },
    [socket],
  );

  const joinRoom = useCallback(
    (gameId: string, password = "") => {
      socket?.emit(GAME_EVENTS.INPUT.JOIN, { gameId, password });
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

  return { createRoom, joinRoom, leaveRoom, setReady, setNotReady, getGameInfo };
}