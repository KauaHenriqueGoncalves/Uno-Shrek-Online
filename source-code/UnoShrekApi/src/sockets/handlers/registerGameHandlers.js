import PinoGlobal from "../../config/logger/PinoGlobal.js";
import GameResponseDto from "../../dtos/response/GameResponseDto.js";
import GAME_EVENTS from "../events/gameEvents.js";
import { GAME_STATUS } from "../../schema/Game.js";

const log = PinoGlobal.getInstance();

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

  socket.on(GAME_EVENTS.INPUT.CREATE, async (data) => {
    try {
      const token = socket.token;
      log.info(
        `Creating game on socket. [playerId=${socket.playerId}] [socketId=${socket.id}]`,
      );
      const gameInfo = await gameService.create(token, data);
      const gameId = (gameInfo.id ?? gameInfo._id)?.toString();
      log.info(
        `Created game on socket. [playerId=${socket.playerId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      socket.join(gameId);
      socket.currentGameId = gameId;
      const { game, players } = await gameService.getByIdInfo(gameId);
      const emited = GameResponseDto.fromDocumentRoom(game, players);
      socket.emit(GAME_EVENTS.OUTPUT.GAME_INFO, emited);
      await broadcastAllGamesByStatus(io, gameService, GAME_STATUS.PENDING);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.GET_BY_ID_INFO, async () => {
    try {
      const gameId = socket.currentGameId;
      log.info(
        `Getting info room game on socket. [playerId=${socket.playerId}] [socketId=${socket.id}] [currentGame=${gameId}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const { game, players } = await gameService.getByIdInfo(gameId);
      const emited = GameResponseDto.fromDocumentRoom(game, players);
      socket.emit(GAME_EVENTS.OUTPUT.GAME_INFO, emited);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.JOIN, async ({ gameId }) => {
    try {
      const token = socket.token;
      const game = await gameService.joinInGame(token, gameId);
      log.info(
        `Player join on game. [playerId=${socket.playerId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      socket.join(gameId);
      socket.currentGameId = gameId;
      log.info(
        `Information about player on game save in socket. [socketId=${socket.id}] [currentGameIdSocket=${socket.currentGameId}]`,
      );
      io.to(gameId).emit(GAME_EVENTS.OUTPUT.JOINED, {
        message: "Player joined",
      });
      await broadcastRoomGameInfo(io, gameService, gameId);
      await broadcastAllGamesByStatus(io, gameService, GAME_STATUS.PENDING);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.LEAVE, async () => {
    try {
      const token = socket.token;
      const gameId = socket.currentGameId;
      const game = await gameService.leaveGame(token, gameId);
      log.info(
        `Player leave game. [playerId=${socket.playerId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      socket.leave(gameId);
      socket.currentGameId = null;
      io.to(gameId).emit(GAME_EVENTS.OUTPUT.LEAVED, {
        message: "Player leaved",
      });
      await broadcastRoomGameInfo(io, gameService, gameId);
      await broadcastAllGamesByStatus(io, gameService, GAME_STATUS.PENDING);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  //socket.on("", async ({}) => {});
}

async function broadcastRoomGameInfo(io, gameService, gameId) {
  const { game, players } = await gameService.getByIdInfo(gameId);
  const emited = GameResponseDto.fromDocumentRoom(game, players);
  io.to(gameId).emit(GAME_EVENTS.OUTPUT.GAME_INFO, emited);
}

async function broadcastAllGamesByStatus(io, gameService, status) {
  const games = await gameService.getAllByStatus(status);
  const emited = GameResponseDto.fromDocumentList(games);
  io.emit(GAME_EVENTS.OUTPUT.LIST_UPDATED, { status, games: emited });
}
