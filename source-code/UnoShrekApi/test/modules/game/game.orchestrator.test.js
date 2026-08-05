import mongoose from "mongoose";
import GameOrchestrator from "../../../src/modules/game/game.orchestrator.js";
import PinoGlobal from "../../../src/modules/shared/logger/pino-global.logger.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";
import { GAME_STATUS } from "../../../src/modules/game/game.schema.js";
import GameEngine from "../../../src/modules/game/game.engine.js";
import { createDeck } from "../../../src/modules/game/deck.js";

jest.mock("../../../src/modules/game/game.repository.js");
jest.mock("../../../src/modules/score/score-player.repository.js");
jest.mock("../../../src/modules/player/player.repository.js");
jest.mock("../../../src/modules/card/card.repository.js");
jest.mock("../../../src/modules/shared/logger/pino-global.logger.js");
jest.mock("../../../src/modules/game/game.engine.js");
jest.mock("../../../src/modules/game/deck.js");

describe("GameOrchestrator", () => {
  let orchestrator;
  let gameRepositoryMock;
  let cardRepositoryMock;

  beforeEach(() => {
    PinoGlobal.getInstance.mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    });
    jest.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: async (fn) => {
        await fn();
      },
      endSession: jest.fn(),
    });

    orchestrator = new GameOrchestrator({}, {}, {}, {});
    gameRepositoryMock = orchestrator.gameRepository;
    cardRepositoryMock = orchestrator.cardRepository;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("start", () => {
    const ownerId = "owner1";
    const gameId = "game1";

    function buildGame(overrides = {}) {
      return {
        _id: gameId,
        owner: { toString: () => ownerId },
        status: GAME_STATUS.PENDING,
        players: [
          { player: { toString: () => ownerId }, ready: true },
          { player: { toString: () => "player2" }, ready: true },
        ],
        ...overrides,
      };
    }

    it("should start the game and deal hands to the players", async () => {
      const game = buildGame();
      const startedGame = { ...game, status: GAME_STATUS.ACTIVE };

      gameRepositoryMock.getById.mockResolvedValue(game);
      createDeck.mockReturnValue([{ color: "red", type: "number", value: "1" }]);
      cardRepositoryMock.createMany.mockResolvedValue([{ _id: "card1" }]);
      GameEngine.startGameState.mockReturnValue({
        deck: [],
        discard: [],
        players: [
          { player: ownerId, hand: { cards: [] } },
          { player: "player2", hand: { cards: [] } },
        ],
        currentPlayer: ownerId,
        direction: 1,
        activeColor: null,
      });
      gameRepositoryMock.update.mockResolvedValue(startedGame);

      const result = await orchestrator.start(ownerId, gameId);

      expect(cardRepositoryMock.createMany).toHaveBeenCalled();
      expect(GameEngine.startGameState).toHaveBeenCalled();
      expect(gameRepositoryMock.update).toHaveBeenCalled();
      expect(game.status).toBe(GAME_STATUS.ACTIVE);
      expect(result).toEqual(startedGame);
    });

    it("should throw BusinessError when caller is not the owner", async () => {
      const game = buildGame();
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(orchestrator.start("intruder", gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when game is not PENDING", async () => {
      const game = buildGame({ status: GAME_STATUS.ACTIVE });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(orchestrator.start(ownerId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when there are less than 2 players", async () => {
      const game = buildGame({
        players: [{ player: { toString: () => ownerId }, ready: true }],
      });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(orchestrator.start(ownerId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when not all players are ready", async () => {
      const game = buildGame({
        players: [
          { player: { toString: () => ownerId }, ready: true },
          { player: { toString: () => "player2" }, ready: false },
        ],
      });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(orchestrator.start(ownerId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
