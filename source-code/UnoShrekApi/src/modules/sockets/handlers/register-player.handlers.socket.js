import PinoGlobal from "../../shared/logger/pino-global.logger.js";
import PLAYER_EVENTS from "../events/player.events.js";
import GAME_EVENTS from "../events/game.events.js";
import { GAME_STATUS } from "../../game/game.schema.js";
import { broadcastRoomGameInfo, broadcastAllGamesByStatus} from "./register-game.handlers.socket.js";
import { onlinePlayers, removeOnlinePlayer } from "./online-players.handlers.js";
import PlayerResponseDto from "../../player/response/player.response.dto.js";
import { startDisconnectTimer, cancelDisconnectTimer} from "./player-inactivity.handlers.js";

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

  socket.on("disconnect", async () => {
    const userId  = socket.playerId;
    const gameId  = socket.currentGameId;

    log.info(
      `Player disconnected. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
    );

    removeOnlinePlayer(userId, socket.id);
    broadcastOnlineCount(socket, io, playerService);

    // Se não estava em nenhuma partida, nada mais a fazer
    if (!gameId) return;

    // Inicia o timer de 60s, se o jogador reconectar, cancela
    startDisconnectTimer(gameId, userId, async () => {
      log.info(
        `Player remained disconnected after timeout. [playerId=${userId}] [gameId=${gameId}]`,
      );

      try {
        const game = await gameService.getById(gameId);

        // Jogo já encerrado
        if (game.status === GAME_STATUS.FINISHED) return;

        // Verifica se ainda há algum humano online na partida
        const hasOnlineHumanPlayer = game.players.some((p) =>
          onlinePlayers.has(p.player.toString()),
        );

        if (!hasOnlineHumanPlayer) {
          log.info(
            `No human players online. Finishing game due to inactivity. [gameId=${gameId}]`,
          );

          await gameService.finishGameByInactivity(gameId);

          io.to(gameId).emit(GAME_EVENTS.OUTPUT.FINISHED, {
            message: "Game finished due to inactivity",
          });

          await broadcastAllGamesByStatus(io, gameService, GAME_STATUS.PENDING);
          return;
        }

        // Ainda há humanos, apenas remove o jogador desconectado da sala
        log.info(
          `Game still has online human players, removing disconnected player. [playerId=${userId}] [gameId=${gameId}]`,
        );

        await gameService.leaveGame(userId, gameId);
        await broadcastRoomGameInfo(io, gameService, gameId);
        await broadcastAllGamesByStatus(io, gameService, GAME_STATUS.PENDING);
      } catch (err) {
        log.warn({ err }, "Failed to process disconnect timeout");
      }
    });
  });
}


export async function broadcastOnlineCount(socket, io, playerService) {
  const onlineCount    = onlinePlayers.size;
  const playersOnlineIds = [...onlinePlayers.keys()];

  log.info(`Broadcasting online count. [onlineCount=${onlineCount}]`);

  if (playersOnlineIds.length === 0) {
    io.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, { onlineCount, players: [] });
    return;
  }

  const players = await playerService.getAllByIds(playersOnlineIds);
  io.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, {
    onlineCount,
    players: PlayerResponseDto.fromDocumentViewSimpleList(players),
  });
}

export async function broadcastRoomMessage(io, socket, playerService, playerId, gameId, message) {
  try {
    message = message.trim();
    if (!playerId)                    throw new Error("PlayerId cannot be empty");
    if (!message || message.length === 0) throw new Error("Message cannot be empty");
    if (message.length >= 500)        throw new Error("Message is too long");

    const player = await playerService.getById(playerId);
    log.info(
      `Broadcasting message. [playerId=${playerId}] [username=${player.username}] [gameId=${gameId}]`,
    );

    io.to(gameId).emit(PLAYER_EVENTS.OUTPUT.MESSAGE_ROOM_OUT, {
      username: player.username,
      message,
    });
  } catch (err) {
    log.warn({ err }, "socket failed");
    socket.emit(PLAYER_EVENTS.OUTPUT.ERROR, { message: err.message });
  }
}