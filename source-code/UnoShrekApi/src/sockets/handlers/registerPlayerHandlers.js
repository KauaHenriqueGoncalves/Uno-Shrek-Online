import PinoGlobal from "../../config/logger/PinoGlobal.js";
import PLAYER_EVENTS from "../events/playerEvents.js";
import { GAME_STATUS } from "../../schema/Game.js";
import { broadcastRoomGameInfo, broadcastAllGamesByStatus } from "./registerGameHandlers.js";

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
      const token = socket.token;
      const gameId = socket.currentGameId;
      log.info(
        `Removing player from game on disconnect. [playerId=${socket.playerId}] [gameId=${gameId}]`,
      );
      const game = await gameService.leaveGame(token, gameId);
      broadcastRoomGameInfo(io, gameService, gameId);
      broadcastAllGamesByStatus(io, gameService, GAME_STATUS.PENDING);
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
