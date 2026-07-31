import PinoGlobal from "../../config/logger/PinoGlobal.js";
import GameResponseDto from "../../dtos/response/GameResponseDto.js";
import GAME_EVENTS from "../events/gameEvents.js";
import { GAME_STATUS } from "../../schema/Game.js";

const log = PinoGlobal.getInstance();

async function broadcastGamesByStatus(io, gameService, status) {
  const games = await gameService.getAllByStatus(status);
  const emited = GameResponseDto.fromDocumentList(games);
  io.emit(GAME_EVENTS.OUTPUT.LIST_UPDATED, { status, games: emited });
}

export default function registerGameHandlers(socket, io, { gameService }) {
  socket.on(GAME_EVENTS.INPUT.GET_ALL_BY_STATUS, async ({ status }) => {
    try {
      const games = await gameService.getAllByStatus(status);
      log.info(
        `Getting all room games on socket. [playerId=${socket.playerId}] [socketId=${socket.id}] [status=${status}]`,
      );
      const emited = GameResponseDto.fromDocumentList(games);
      socket.emit(GAME_EVENTS.OUTPUT.LIST_UPDATED, { status, games: emited });
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.JOIN, async ({ gameId }) => {
    try {
      const token = socket.token;
      const game = await gameService.joinInGame(token, gameId);
      socket.emit(GAME_EVENTS.OUTPUT.JOINED, { message: "User joined the game successfully" });
      await broadcastGamesByStatus(io, gameService, GAME_STATUS.PENDING);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });
}
