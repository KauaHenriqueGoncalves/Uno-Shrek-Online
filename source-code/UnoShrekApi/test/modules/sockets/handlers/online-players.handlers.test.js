import { onlinePlayers, addOnlinePlayer, removeOnlinePlayer } from "../../../../src/modules/sockets/handlers/online-players.handlers.js";

jest.mock("../../../../src/modules/shared/logger/pino-global.logger.js", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

describe("onlinePlayers", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    onlinePlayers.clear();
  });

  describe("addOnlinePlayer", () => {
    it("should add player to onlinePlayers list (Happy Path)", () => {
      const playerId = "507f1f77bcf86cd799439011";
      const socketId = "socket123";

      addOnlinePlayer(playerId, socketId);

      expect(onlinePlayers.has(playerId)).toBe(true);
      expect(onlinePlayers.get(playerId)).toBeInstanceOf(Set);
      expect(onlinePlayers.get(playerId).has(socketId)).toBe(true);
    });

    it("should add multiple sockets for same player", () => {
      const playerId = "507f1f77bcf86cd799439011";
      const socket1 = "socket123";
      const socket2 = "socket456";

      addOnlinePlayer(playerId, socket1);
      addOnlinePlayer(playerId, socket2);

      expect(onlinePlayers.size).toBe(1);
      expect(onlinePlayers.get(playerId).size).toBe(2);
      expect(onlinePlayers.get(playerId).has(socket1)).toBe(true);
      expect(onlinePlayers.get(playerId).has(socket2)).toBe(true);
    });
  });

  describe("removeOnlinePlayer", () => {
    it("should remove socket from player (Happy Path)", () => {
      const playerId = "507f1f77bcf86cd799439011";
      const socket1 = "socket123";
      const socket2 = "socket456";

      addOnlinePlayer(playerId, socket1);
      addOnlinePlayer(playerId, socket2);

      removeOnlinePlayer(playerId, socket1);

      expect(onlinePlayers.has(playerId)).toBe(true);
      expect(onlinePlayers.get(playerId).has(socket1)).toBe(false);
      expect(onlinePlayers.get(playerId).has(socket2)).toBe(true);
    });

    it("should remove player from list when all sockets are removed", () => {
      const playerId = "507f1f77bcf86cd799439011";
      const socketId = "socket123";

      addOnlinePlayer(playerId, socketId);
      removeOnlinePlayer(playerId, socketId);

      expect(onlinePlayers.has(playerId)).toBe(false);
    });
  });
});