import PinoGlobal from "../../shared/logger/pino-global.logger.js";
import PLAYER_EVENTS from "../events/player.events.js";
import { GAME_STATUS } from "../../game/game.schema.js";
import { broadcastRoomGameInfo, broadcastAllGamesByStatus } from "./register-game.handlers.socket.js";

const log = PinoGlobal.getInstance();

export default function registerPlayerHandlers(socket, io, { playerService, gameService }) {
  socket.on(PLAYER_EVENTS.INPUT.GET_ONLINE_COUNT, () => {
    log.info(
      `Player getting online count. [playerId=${socket.playerId}] [socketId=${socket.id}]`,
    );
    socket.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, {
      onlineCount: io.engine.clientsCount,
    });
  });

  broadcastOnlineCount(io, true);

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

function broadcastOnlineCount(io, login) {
  const onlineCount = login ? io.engine.clientsCount : io.engine.clientsCount - 1; // gambiarra
  log.info(`Broadcasting online count. [onlineCount=${onlineCount}]`);
  io.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, { onlineCount });
}
