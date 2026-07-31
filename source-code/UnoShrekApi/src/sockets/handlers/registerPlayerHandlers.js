import PinoGlobal from "../../config/logger/PinoGlobal.js";
import PLAYER_EVENTS from "../events/playerEvents.js";

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

  broadcastOnlineCount(io);

  socket.on("disconnect", () => {
    if (!socket.currentGameId) return;

    try {
      const gameId = socket.currentGameId;

      log.info(
        `Removing player from game on disconnect. [playerId=${socket.playerId}] [gameId=${gameId}]`,
      );

      // const game = await gameService.removePlayer(gameId, socket.playerId);

      // // avisa quem ficou na sala que esse player saiu
      // io.to(gameId).emit(GAME_EVENTS.PLAYER_LEFT, {
      //   playerId: socket.playerId,
      //   game: GameResponseDto.fromDocument(game),
      // });
      broadcastGamesByStatus(io, gameService, GAME_STATUS.PENDING);
    } catch (err) {
      log.warn({ err }, "failed to remove player from game on disconnect");
    }
  });
}

function broadcastOnlineCount(io) {
  const onlineCount = io.engine.clientsCount;
  log.info(`Broadcasting online count. [onlineCount=${onlineCount}]`);
  io.emit(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, { onlineCount });
}
