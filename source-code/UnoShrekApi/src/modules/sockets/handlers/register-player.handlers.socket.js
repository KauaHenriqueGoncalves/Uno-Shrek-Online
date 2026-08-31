import PinoGlobal from "../../shared/logger/pino-global.logger.js";
import PLAYER_EVENTS from "../events/player.events.js";
import { GAME_STATUS } from "../../game/game.schema.js";
import { broadcastRoomGameInfo, broadcastAllGamesByStatus } from "./register-game.handlers.socket.js";
import { onlinePlayers, removeOnlinePlayer } from "./online-players.handlers.js";
import PlayerResponseDto from "../../player/response/player.response.dto.js";
import { startDisconnectTimer } from "./player-inactivity.handlers.js";
import GAME_EVENTS from "../events/game.events.js";


const log = PinoGlobal.getInstance();

export function registerPlayerHandlers(socket, io, { playerService, gameService }) {
  broadcastOnlineCount(socket, io, playerService);

  socket.on(PLAYER_EVENTS.INPUT.GET_ONLINE_COUNT, () => {
    log.info(
      `Player getting online count. [playerId=${socket.playerId}] [socketId=${socket.id}]`,
    );
    socket.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, {
      onlineCount: onlinePlayers.size,
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

startDisconnectTimer(gameId, userId, async () => {
  log.info(
    `Player remained disconnected after timeout. [playerId=${userId}] [gameId=${gameId}]`,
  );

  const game = await gameService.getById(gameId);

  const hasOnlineHumanPlayer = game.players.some((gamePlayer) => {
    const playerId = gamePlayer.player.toString();

    return onlinePlayers.has(playerId);
  });

  if (!hasOnlineHumanPlayer) {
    log.info(
      `No human players online. Finishing game due to inactivity. [gameId=${gameId}]`,
    );

    await gameService.finishGameByInactivity(gameId);

    io.to(gameId).emit(GAME_EVENTS.OUTPUT.FINISHED, {
    message: "Game finished due to inactivity",
    });

    await broadcastAllGamesByStatus(
      io,
      gameService,
      GAME_STATUS.PENDING,
      );

      return;
    }

  log.info(
    `Game still has online human players. [gameId=${gameId}]`,
  );
});

export async function broadcastOnlineCount(socket, io, playerService) {
  const onlineCount = onlinePlayers.size;
  log.info(`Broadcasting online count. [onlineCount=${onlineCount}]`);
  const playersOnlineIds = [...onlinePlayers.keys()];
  if (playersOnlineIds.size === 0) {
    log.info(`No one online. [onlinePlayers=${onlineCount}]`);
    return;
  }
  const players = await playerService.getAllByIds(playersOnlineIds);
  io.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, { 
    onlineCount, 
    players: PlayerResponseDto.fromDocumentViewSimpleList(players) 
  });
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
    if (message.length >= 500) {
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