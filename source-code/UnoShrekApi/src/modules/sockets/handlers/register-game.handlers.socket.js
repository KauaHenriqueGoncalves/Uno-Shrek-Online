import PinoGlobal from "../../shared/logger/pino-global.logger.js";
import GameResponseDto from "../../game/response/game.response.dto.js";
import GAME_EVENTS from "../events/game.events.js";
import { GAME_STATUS } from "../../game/game.schema.js";

const log = PinoGlobal.getInstance();

export function registerGameHandlers(socket, io, { gameService }) {
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

  socket.on(GAME_EVENTS.INPUT.GET_BY_ID_INFO, async () => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Getting info room game on socket. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const { game, players } = await gameService.getByIdInfo(gameId);
      log.info(
        `Player got info room game on socket. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      const emited = GameResponseDto.fromDocumentRoom(game, players);
      socket.emit(GAME_EVENTS.OUTPUT.GAME_INFO, emited);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.CREATE, async (data) => {
    try {
      const userId = socket.playerId;
      log.info(
        `Creating game on socket. [playerId=${socket.playerId}] [socketId=${socket.id}]`,
      );
      const gameCreated = await gameService.create(userId, data);
      const gameId = (gameCreated.id ?? gameCreated._id)?.toString();
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

  socket.on(GAME_EVENTS.INPUT.JOIN, async ({ gameId, password }) => {
    try {
      const userId = socket.playerId;
      log.info(
        `Player joining on game on socket. [playerId=${userId}] [socketId=${socket.id}]`,
      );
      const game = await gameService.joinInGame(userId, gameId, password);
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
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Player leaving on game on socket. [playerId=${userId}][socketId=${socket.id}] [gameId=${gameId}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const game = await gameService.leaveGame(userId, gameId);
      log.info(
        `Player leave game. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
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

  socket.on(GAME_EVENTS.INPUT.READY, async () => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Player click ready on game on socket. [playerId=${userId}] [gameId=${gameId}] [socketId=${socket.id}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const game = await gameService.readyInGame(userId, gameId);
      log.info(
        `Player is ready on game. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      await broadcastRoomGameInfo(io, gameService, gameId);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.NOT_READY, async () => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Player click not ready on game on socket. [playerId=${userId}] [gameId=${gameId}] [socketId=${socket.id}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const game = await gameService.notReadyInGame(userId, gameId);
      log.info(
        `Player is ready on game. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      await broadcastRoomGameInfo(io, gameService, gameId);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.DRAW, async () => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Player click draw on game on socket. [playerId=${userId}] [gameId=${gameId}] [socketId=${socket.id}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const game = await gameService.draw(userId, gameId);
      log.info(
        `Player drawed a card on game. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      await broadcastRoomGameInfo(io, gameService, gameId);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.PLAY, async ({ cardId, colorChoice }) => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Player play a card on game on socket. [playerId=${userId}] [gameId=${gameId}] [socketId=${socket.id}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const game = await gameService.play(userId, gameId, cardId, colorChoice);
      log.info(
        `Player played a card on game. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      await broadcastRoomGameInfo(io, gameService, gameId);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.SAY_UNO, async () => {
    try {
      const gameId = socket.currentGameId;
      if (!gameId) throw Error("Dont have a current game");
      await gameService.sayUno(socket.playerId, gameId);
      await broadcastRoomGameInfo(io, gameService, gameId);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.CHALLENGE_UNO, async () => {
    try {
      const gameId = socket.currentGameId;
      if (!gameId) throw Error("Dont have a current game");
      await gameService.challengeUno(socket.playerId, gameId);
      await broadcastRoomGameInfo(io, gameService, gameId);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.START, async () => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Player start a game on socket. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const game = await gameService.startGame(userId, gameId);
      log.info(
        `Owner started a game. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      await broadcastRoomGameInfo(io, gameService, gameId);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });

  socket.on(GAME_EVENTS.INPUT.FINISH, async () => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Owner click to finesh a game on socket. [playerId=${userId}] [socketId=${socket.id}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      const game = await gameService.finishedGame(userId, gameId);
      socket.leave(gameId);
      socket.currentGameId = null;
      log.info(
        `Owner fineshed a game. [playerId=${userId}] [socketId=${socket.id}] [gameId=${gameId}]`,
      );
      io.to(gameId).emit(GAME_EVENTS.OUTPUT.FINISHED, { message: "Owner finished the game" });
      await broadcastRoomGameInfo(io, gameService, gameId);
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(GAME_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });
}

export async function broadcastRoomGameInfo(io, gameService, gameId) {
  log.info(
    `Send game info on game with broadcast. [gameId=${gameId}]`,
  );
  const { game, players } = await gameService.getByIdInfo(gameId);
  log.info(
    `Sended game info on game with broadcast. [gameId=${gameId}]`,
  );
  const emited = GameResponseDto.fromDocumentRoom(game, players);
  io.to(gameId).emit(GAME_EVENTS.OUTPUT.GAME_INFO, emited);
}

export async function broadcastAllGamesByStatus(io, gameService, status) {
  log.info(
    `Send games status for all with broadcast. [status=${status}]`,
  );
  const games = await gameService.getAllByStatus(status);
  const emited = GameResponseDto.fromDocumentList(games);
  io.emit(GAME_EVENTS.OUTPUT.LIST_UPDATED, { status, games: emited });
}
