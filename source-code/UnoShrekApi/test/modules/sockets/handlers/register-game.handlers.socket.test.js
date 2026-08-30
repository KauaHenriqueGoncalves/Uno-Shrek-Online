import {
  registerGameHandlers,
  broadcastRoomGameInfo,
  broadcastAllGamesByStatus,
} from "../../../../src/modules/sockets/handlers/register-game.handlers.socket.js";
import GAME_EVENTS from "../../../../src/modules/sockets/events/game.events.js";
import { GAME_STATUS } from "../../../../src/modules/game/game.schema.js";

jest.mock(
  "../../../../src/modules/shared/logger/pino-global.logger.js",
  () => ({
    __esModule: true,
    default: {
      getInstance: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }),
    },
  }),
);

jest.mock("../../../../src/modules/game/response/game.response.dto.js", () => ({
  __esModule: true,
  default: {
    fromDocumentList: jest.fn((games) => games),
    fromDocumentRoom: jest.fn((game, players) => ({ game, players })),
  },
}));

describe("game.handlers (socket)", () => {
  let socket;
  let io;
  let gameService;
  let handlers;

  function getHandler(event) {
    return handlers[event];
  }

  beforeEach(() => {
    handlers = {};

    socket = {
      id: "socket-1",
      playerId: "player-1",
      currentGameId: null,
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
    };

    io = {
      to: jest.fn(() => io),
      emit: jest.fn(),
    };

    gameService = {
      getAllByStatus: jest.fn(),
      getByIdInfo: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      joinInGame: jest.fn(),
      leaveGame: jest.fn(),
      readyInGame: jest.fn(),
      notReadyInGame: jest.fn(),
      draw: jest.fn(),
      play: jest.fn(),
      sayUno: jest.fn(),
      challengeUno: jest.fn(),
      startGame: jest.fn(),
      finishedGame: jest.fn(),
    };

    registerGameHandlers(socket, io, { gameService });
  });

  test("GET_ALL_BY_STATUS outputs a list of games to the socket", async () => {
    gameService.getAllByStatus.mockResolvedValue([{ id: "g1" }]);

    await getHandler(GAME_EVENTS.INPUT.GET_ALL_BY_STATUS)({
      status: GAME_STATUS.PENDING,
    });

    expect(gameService.getAllByStatus).toHaveBeenCalledWith(
      GAME_STATUS.PENDING,
    );
    expect(socket.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.LIST_UPDATED, {
      status: GAME_STATUS.PENDING,
      games: [{ id: "g1" }],
    });
  });

  test("GET_ALL_BY_STATUS issues error when service fails", async () => {
    gameService.getAllByStatus.mockRejectedValue(new Error("boom"));

    await getHandler(GAME_EVENTS.INPUT.GET_ALL_BY_STATUS)({
      status: GAME_STATUS.PENDING,
    });

    expect(socket.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.ERROR, {
      message: "boom",
    });
  });

  test("GET_BY_ID_INFO throws error when there is no currentGameId", async () => {
    socket.currentGameId = null;

    await getHandler(GAME_EVENTS.INPUT.GET_BY_ID_INFO)();

    expect(gameService.getByIdInfo).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.ERROR, {
      message: "Dont have a current game",
    });
  });

  test("GET_BY_ID_INFO emits room information when there is currentGameId", async () => {
    socket.currentGameId = "game-1";
    gameService.getByIdInfo.mockResolvedValue({
      game: { id: "game-1" },
      players: [],
    });

    await getHandler(GAME_EVENTS.INPUT.GET_BY_ID_INFO)();

    expect(gameService.getByIdInfo).toHaveBeenCalledWith("game-1");
    expect(socket.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.GAME_INFO, {
      game: { id: "game-1" },
      players: [],
    });
  });

  test("CREATE creates the game, enters the room and broadcasts the pending list", async () => {
    gameService.create.mockResolvedValue({ _id: "game-1" });
    gameService.getByIdInfo.mockResolvedValue({
      game: { id: "game-1" },
      players: [],
    });
    gameService.getAllByStatus.mockResolvedValue([]);

    await getHandler(GAME_EVENTS.INPUT.CREATE)({ title: "Partida" });

    expect(gameService.create).toHaveBeenCalledWith("player-1", {
      title: "Partida",
    });
    expect(socket.join).toHaveBeenCalledWith("game-1");
    expect(socket.currentGameId).toBe("game-1");
    expect(socket.emit).toHaveBeenCalledWith(
      GAME_EVENTS.OUTPUT.GAME_INFO,
      expect.any(Object),
    );
    expect(gameService.getAllByStatus).toHaveBeenCalledWith(
      GAME_STATUS.PENDING,
    );
    expect(io.emit).toHaveBeenCalledWith(
      GAME_EVENTS.OUTPUT.LIST_UPDATED,
      expect.any(Object),
    );
  });

  test("JOIN enters a new room (player is not in it yet)", async () => {
    gameService.getById.mockResolvedValue({
      players: [{ player: { toString: () => "other-player" } }],
    });
    gameService.joinInGame.mockResolvedValue({ _id: "game-1" });
    gameService.getByIdInfo.mockResolvedValue({ game: {}, players: [] });
    gameService.getAllByStatus.mockResolvedValue([]);

    await getHandler(GAME_EVENTS.INPUT.JOIN)({
      gameId: "game-1",
      password: "",
    });

    expect(gameService.joinInGame).toHaveBeenCalledWith(
      "player-1",
      "game-1",
      "",
    );
    expect(socket.join).toHaveBeenCalledWith("game-1");
    expect(socket.currentGameId).toBe("game-1");
    expect(io.to).toHaveBeenCalledWith("game-1");
    expect(io.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.JOINED, {
      message: "Player joined",
    });
  });

  test("JOIN reconnects the socket without calling joinInGame if the player is already in the room", async () => {
    gameService.getById.mockResolvedValue({
      players: [{ player: { toString: () => "player-1" } }],
    });
    gameService.getByIdInfo.mockResolvedValue({ game: {}, players: [] });
    gameService.getAllByStatus.mockResolvedValue([]);

    await getHandler(GAME_EVENTS.INPUT.JOIN)({ gameId: "game-1" });

    expect(gameService.joinInGame).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith("game-1");
    expect(socket.currentGameId).toBe("game-1");
  });

  test("JOIN issues error when service fails", async () => {
    gameService.getById.mockRejectedValue(new Error("Game not found"));

    await getHandler(GAME_EVENTS.INPUT.JOIN)({ gameId: "invalid" });

    expect(socket.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.ERROR, {
      message: "Game not found",
    });
  });

  test("LEAVE removes the socket from the room and broadcasts", async () => {
    socket.currentGameId = "game-1";
    gameService.leaveGame.mockResolvedValue({});
    gameService.getByIdInfo.mockResolvedValue({ game: {}, players: [] });
    gameService.getAllByStatus.mockResolvedValue([]);

    await getHandler(GAME_EVENTS.INPUT.LEAVE)();

    expect(gameService.leaveGame).toHaveBeenCalledWith("player-1", "game-1");
    expect(socket.leave).toHaveBeenCalledWith("game-1");
    expect(socket.currentGameId).toBeNull();
    expect(io.to).toHaveBeenCalledWith("game-1");
    expect(io.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.LEAVED, {
      message: "Player leaved",
    });
  });

  test.each([
    [GAME_EVENTS.INPUT.READY, "readyInGame"],
    [GAME_EVENTS.INPUT.NOT_READY, "notReadyInGame"],
    [GAME_EVENTS.INPUT.DRAW, "draw"],
  ])(
    "%s chama gameService.%s e faz broadcast da sala",
    async (event, serviceMethod) => {
      socket.currentGameId = "game-1";
      gameService[serviceMethod].mockResolvedValue({});
      gameService.getByIdInfo.mockResolvedValue({ game: {}, players: [] });

      await getHandler(event)();

      expect(gameService[serviceMethod]).toHaveBeenCalledWith(
        "player-1",
        "game-1",
      );
      expect(gameService.getByIdInfo).toHaveBeenCalledWith("game-1");
      expect(io.emit).toHaveBeenCalledWith(
        GAME_EVENTS.OUTPUT.GAME_INFO,
        expect.any(Object),
      );
    },
  );

  test("PLAY calls gameService.play with cardId and colorChoice", async () => {
    socket.currentGameId = "game-1";
    gameService.play.mockResolvedValue({});
    gameService.getByIdInfo.mockResolvedValue({ game: {}, players: [] });

    await getHandler(GAME_EVENTS.INPUT.PLAY)({
      cardId: "card-1",
      colorChoice: "red",
    });

    expect(gameService.play).toHaveBeenCalledWith(
      "player-1",
      "game-1",
      "card-1",
      "red",
    );
  });

  test("SAY_UNO throws error without currentGameId and does not call the service", async () => {
    socket.currentGameId = null;

    await getHandler(GAME_EVENTS.INPUT.SAY_UNO)();

    expect(gameService.sayUno).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.ERROR, {
      message: "Dont have a current game",
    });
  });

  test("CHALLENGE_UNO calls gameService.challengeUno", async () => {
    socket.currentGameId = "game-1";
    gameService.challengeUno.mockResolvedValue({});
    gameService.getByIdInfo.mockResolvedValue({ game: {}, players: [] });

    await getHandler(GAME_EVENTS.INPUT.CHALLENGE_UNO)();

    expect(gameService.challengeUno).toHaveBeenCalledWith("player-1", "game-1");
  });

  test("START calls gameService.startGame and broadcasts", async () => {
    socket.currentGameId = "game-1";
    gameService.startGame.mockResolvedValue({});
    gameService.getByIdInfo.mockResolvedValue({ game: {}, players: [] });

    await getHandler(GAME_EVENTS.INPUT.START)();

    expect(gameService.startGame).toHaveBeenCalledWith("player-1", "game-1");
  });

  test("FINISH ends the game, leaves the room and issues FINISHED", async () => {
    socket.currentGameId = "game-1";
    gameService.finishedGame.mockResolvedValue({});
    gameService.getByIdInfo.mockResolvedValue({ game: {}, players: [] });

    await getHandler(GAME_EVENTS.INPUT.FINISH)();

    expect(gameService.finishedGame).toHaveBeenCalledWith("player-1", "game-1");
    expect(socket.leave).toHaveBeenCalledWith("game-1");
    expect(socket.currentGameId).toBeNull();
    expect(io.to).toHaveBeenCalledWith("game-1");
    expect(io.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.FINISHED, {
      message: "Owner finished the game",
    });
  });
});

describe("broadcastRoomGameInfo", () => {
  test("fetches room info and sends it to all sockets in the room", async () => {
    const io = { to: jest.fn(() => io), emit: jest.fn() };
    const gameService = {
      getByIdInfo: jest
        .fn()
        .mockResolvedValue({ game: { id: "game-1" }, players: [] }),
    };

    await broadcastRoomGameInfo(io, gameService, "game-1");

    expect(gameService.getByIdInfo).toHaveBeenCalledWith("game-1");
    expect(io.to).toHaveBeenCalledWith("game-1");
    expect(io.emit).toHaveBeenCalledWith(
      GAME_EVENTS.OUTPUT.GAME_INFO,
      expect.any(Object),
    );
  });
});

describe("broadcastAllGamesByStatus", () => {
  test("Search games by status and broadcast globally", async () => {
    const io = { emit: jest.fn() };
    const gameService = {
      getAllByStatus: jest.fn().mockResolvedValue([{ id: "g1" }]),
    };

    await broadcastAllGamesByStatus(io, gameService, GAME_STATUS.PENDING);

    expect(gameService.getAllByStatus).toHaveBeenCalledWith(
      GAME_STATUS.PENDING,
    );
    expect(io.emit).toHaveBeenCalledWith(GAME_EVENTS.OUTPUT.LIST_UPDATED, {
      status: GAME_STATUS.PENDING,
      games: [{ id: "g1" }],
    });
  });
});
