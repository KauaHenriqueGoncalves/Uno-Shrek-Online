import PinoGlobal from "../../shared/logger/pino-global.logger.js";
import PLAYER_EVENTS from "../events/player.events.js";
import { GAME_STATUS } from "../../game/game.schema.js";
import {
  broadcastRoomGameInfo,
  broadcastAllGamesByStatus,
} from "./register-game.handlers.socket.js";

const log = PinoGlobal.getInstance();

export default function registerPlayerHandlers(socket, io, { playerService, gameService }) {
  broadcastOnlineCount(io, true);

  socket.on(PLAYER_EVENTS.INPUT.GET_ONLINE_COUNT, () => {
    log.info(
      `Player getting online count. [playerId=${socket.playerId}] [socketId=${socket.id}]`,
    );
    socket.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, {
      onlineCount: io.engine.clientsCount,
    });
  });

  socket.on(PLAYER_EVENTS.INPUT.MESSAGE_ROOM, async ({ message }) => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Player send a message on game on socket. [playerId=${userId}] [gameId=${gameId}] [socketId=${socket.id}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      broadcastRoomMessage(io, socket, playerService, userId, gameId, message);
      log.info(
        `Player sended a message on game. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}] [message=${message}]`,
      );
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(PLAYER_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on("disconnect", async () => {
    log.info(
      `Player desconect. [playerId=${socket.playerId}] [socketId=${socket.id}]`,
    );
    broadcastOnlineCount(io, false);
    if (!socket.currentGameId) return;
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Removing player from game on disconnect. [playerId=${socket.playerId}] [gameId=${gameId}]`,
      );
      const game = await gameService.leaveGame(userId, gameId);
      await broadcastRoomGameInfo(io, gameService, gameId);
      await broadcastAllGamesByStatus(io, gameService, GAME_STATUS.PENDING);
    } catch (err) {
      log.warn({ err }, "failed to remove player from game on disconnect");
    }
  });
}

export function broadcastOnlineCount(io, login) {
  const onlineCount = login
    ? io.engine.clientsCount
    : io.engine.clientsCount - 1; // gambiarra
  log.info(`Broadcasting online count. [onlineCount=${onlineCount}]`);
  io.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, { onlineCount });
}

export async function broadcastRoomMessage(io, socket, playerService, playerId, gameId, message) {
  try {
    message = message.trim();
    if (!playerId) {
      throw Error("PlayerId cannot be empty to send message");
    }
    if (!message || message.length === 0) {
      throw Error("Message cannot be empty to send message");
    }
    if (message.length >= 300) {
      throw Error("Message is very long");
    }
    const player = await playerService.getById(playerId);
    log.info(
      `Broadcasting sending message. [playerId=${playerId}] [username=${player.username}] [gameId=${gameId}] [message=${message}]`,
    );
    const emited = {
      username: player.username,
      message: message,
    };
    io.to(gameId).emit(PLAYER_EVENTS.OUTPUT.MESSAGE_ROOM_OUT, emited);
  } catch (err) {
    log.warn({ err }, "socket failed");
    socket.emit(PLAYER_EVENTS.OUTPUT.ERROR, { message: err.message });
  }
}
