import {
  registerPlayerHandlers,
  broadcastOnlineCount,
  broadcastRoomMessage,
} from "../../../../src/modules/sockets/handlers/register-player.handlers.socket.js";
import PLAYER_EVENTS from "../../../../src/modules/sockets/events/player.events.js";
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

let mockOnlinePlayers;
const mockRemoveOnlinePlayer = jest.fn();
jest.mock(
  "../../../../src/modules/sockets/handlers/online-players.handlers.js",
  () => ({
    __esModule: true,
    get onlinePlayers() {
      return mockOnlinePlayers;
    },
    removeOnlinePlayer: (...args) => mockRemoveOnlinePlayer(...args),
  }),
);

const mockBroadcastRoomGameInfo = jest.fn();
const mockBroadcastAllGamesByStatus = jest.fn();
jest.mock(
  "../../../../src/modules/sockets/handlers/register-game.handlers.socket.js",
  () => ({
    __esModule: true,
    broadcastRoomGameInfo: (...args) => mockBroadcastRoomGameInfo(...args),
    broadcastAllGamesByStatus: (...args) =>
      mockBroadcastAllGamesByStatus(...args),
  }),
);

jest.mock(
  "../../../../src/modules/player/response/player.response.dto.js",
  () => ({
    __esModule: true,
    default: {
      fromDocumentViewSimpleList: jest.fn((players) => players),
    },
  }),
);

describe("player.handlers.socket", () => {
  let socket;
  let io;
  let playerService;
  let gameService;
  let handlers;

  function getHandler(event) {
    return handlers[event];
  }

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    mockOnlinePlayers = new Map();

    socket = {
      id: "socket-1",
      playerId: "player-1",
      currentGameId: null,
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
    };

    io = {
      to: jest.fn(() => io),
      emit: jest.fn(),
    };

    playerService = {
      getAllByIds: jest.fn().mockResolvedValue([]),
      getById: jest.fn(),
    };

    gameService = {
      leaveGame: jest.fn(),
    };
  });

  describe("registerPlayerHandlers", () => {
    test("broadcasts the online count immediately on registration", async () => {
      mockOnlinePlayers.set("player-1", new Set(["socket-1"]));

      registerPlayerHandlers(socket, io, { playerService, gameService });

      // broadcastOnlineCount runs async; flush microtasks.
      await Promise.resolve();
      await Promise.resolve();

      expect(playerService.getAllByIds).toHaveBeenCalledWith(["player-1"]);
      expect(io.emit).toHaveBeenCalledWith(
        PLAYER_EVENTS.OUTPUT.ONLINE_COUNT,
        expect.objectContaining({ onlineCount: 1 }),
      );
    });

    test("GET_ONLINE_COUNT replies to the requesting socket only, with the current size", () => {
      mockOnlinePlayers.set("player-1", new Set(["socket-1"]));
      mockOnlinePlayers.set("player-2", new Set(["socket-2"]));

      registerPlayerHandlers(socket, io, { playerService, gameService });
      socket.emit.mockClear();

      getHandler(PLAYER_EVENTS.INPUT.GET_ONLINE_COUNT)();

      expect(socket.emit).toHaveBeenCalledWith(
        PLAYER_EVENTS.OUTPUT.ONLINE_COUNT,
        {
          onlineCount: 2,
        },
      );
    });

    test("MESSAGE_ROOM broadcasts a chat message when a current game exists", async () => {
      socket.currentGameId = "game-1";
      playerService.getById.mockResolvedValue({ username: "shrek" });

      registerPlayerHandlers(socket, io, { playerService, gameService });

      await getHandler(PLAYER_EVENTS.INPUT.MESSAGE_ROOM)({ message: "hello" });

      expect(playerService.getById).toHaveBeenCalledWith("player-1");
      expect(io.to).toHaveBeenCalledWith("game-1");
      expect(io.emit).toHaveBeenCalledWith(
        PLAYER_EVENTS.OUTPUT.MESSAGE_ROOM_OUT,
        {
          username: "shrek",
          message: "hello",
        },
      );
    });

    test("MESSAGE_ROOM emits an error when there is no current game", async () => {
      socket.currentGameId = null;

      registerPlayerHandlers(socket, io, { playerService, gameService });

      await getHandler(PLAYER_EVENTS.INPUT.MESSAGE_ROOM)({ message: "hello" });

      expect(playerService.getById).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(PLAYER_EVENTS.OUTPUT.ERROR, {
        message: "Dont have a current game",
      });
    });

    describe("disconnect", () => {
      test("removes the player from the online registry and rebroadcasts the online count", async () => {
        mockOnlinePlayers.set("player-1", new Set(["socket-1"]));
        socket.currentGameId = null;

        registerPlayerHandlers(socket, io, { playerService, gameService });
        io.emit.mockClear();

        await getHandler("disconnect")();

        expect(mockRemoveOnlinePlayer).toHaveBeenCalledWith(
          "player-1",
          "socket-1",
        );
        expect(io.emit).toHaveBeenCalledWith(
          PLAYER_EVENTS.OUTPUT.ONLINE_COUNT,
          expect.any(Object),
        );
      });

      test("does not touch the game when the socket has no current game", async () => {
        socket.currentGameId = null;

        registerPlayerHandlers(socket, io, { playerService, gameService });

        await getHandler("disconnect")();

        expect(gameService.leaveGame).not.toHaveBeenCalled();
        expect(mockBroadcastRoomGameInfo).not.toHaveBeenCalled();
        expect(mockBroadcastAllGamesByStatus).not.toHaveBeenCalled();
      });

      test("removes the player from the game and broadcasts updates when a current game exists", async () => {
        socket.currentGameId = "game-1";
        gameService.leaveGame.mockResolvedValue({});

        registerPlayerHandlers(socket, io, { playerService, gameService });

        await getHandler("disconnect")();

        expect(gameService.leaveGame).toHaveBeenCalledWith(
          "player-1",
          "game-1",
        );
        expect(mockBroadcastRoomGameInfo).toHaveBeenCalledWith(
          io,
          gameService,
          "game-1",
        );
        expect(mockBroadcastAllGamesByStatus).toHaveBeenCalledWith(
          io,
          gameService,
          GAME_STATUS.PENDING,
        );
      });

      test("swallows errors thrown while removing the player from the game", async () => {
        socket.currentGameId = "game-1";
        gameService.leaveGame.mockRejectedValue(new Error("boom"));

        registerPlayerHandlers(socket, io, { playerService, gameService });

        await expect(getHandler("disconnect")()).resolves.not.toThrow();
        expect(mockBroadcastRoomGameInfo).not.toHaveBeenCalled();
      });
    });
  });

  describe("broadcastOnlineCount", () => {
    test("fetches online players and emits count with player list", async () => {
      mockOnlinePlayers.set("player-1", new Set(["socket-1"]));
      playerService.getAllByIds.mockResolvedValue([
        { id: "player-1", username: "shrek" },
      ]);

      await broadcastOnlineCount(socket, io, playerService);

      expect(playerService.getAllByIds).toHaveBeenCalledWith(["player-1"]);
      expect(io.emit).toHaveBeenCalledWith(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, {
        onlineCount: 1,
        players: [{ id: "player-1", username: "shrek" }],
      });
    });

    // NOTE: this documents current behavior, not necessarily intended behavior.
    // `playersOnlineIds` is an array, so `.size` is always undefined and the
    // "no one online" early-return branch never triggers. Worth a bugfix:
    // it should check `playersOnlineIds.length === 0` instead.
    test("still calls the service even when no one is online (documents current bug)", async () => {
      await broadcastOnlineCount(socket, io, playerService);

      expect(playerService.getAllByIds).toHaveBeenCalledWith([]);
      expect(io.emit).toHaveBeenCalledWith(PLAYER_EVENTS.OUTPUT.ONLINE_COUNT, {
        onlineCount: 0,
        players: [],
      });
    });
  });

  describe("broadcastRoomMessage", () => {
    test("emits the trimmed message to the game room", async () => {
      playerService.getById.mockResolvedValue({ username: "shrek" });

      await broadcastRoomMessage(
        io,
        socket,
        playerService,
        "player-1",
        "game-1",
        "  hi  ",
      );

      expect(io.to).toHaveBeenCalledWith("game-1");
      expect(io.emit).toHaveBeenCalledWith(
        PLAYER_EVENTS.OUTPUT.MESSAGE_ROOM_OUT,
        {
          username: "shrek",
          message: "hi",
        },
      );
    });

    test("emits an error when playerId is missing", async () => {
      await broadcastRoomMessage(
        io,
        socket,
        playerService,
        null,
        "game-1",
        "hi",
      );

      expect(playerService.getById).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(PLAYER_EVENTS.OUTPUT.ERROR, {
        message: "PlayerId cannot be empty to send message",
      });
    });

    test("emits an error when the message is empty after trimming", async () => {
      await broadcastRoomMessage(
        io,
        socket,
        playerService,
        "player-1",
        "game-1",
        "   ",
      );

      expect(playerService.getById).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(PLAYER_EVENTS.OUTPUT.ERROR, {
        message: "Message cannot be empty to send message",
      });
    });

    test("emits an error when the message is too long", async () => {
      const longMessage = "a".repeat(500);

      await broadcastRoomMessage(
        io,
        socket,
        playerService,
        "player-1",
        "game-1",
        longMessage,
      );

      expect(playerService.getById).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(PLAYER_EVENTS.OUTPUT.ERROR, {
        message: "Message is very long",
      });
    });

    test("emits an error when playerService.getById fails", async () => {
      playerService.getById.mockRejectedValue(new Error("Player not found"));

      await broadcastRoomMessage(
        io,
        socket,
        playerService,
        "player-1",
        "game-1",
        "hi",
      );

      expect(io.emit).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(PLAYER_EVENTS.OUTPUT.ERROR, {
        message: "Player not found",
      });
    });
  });
});
