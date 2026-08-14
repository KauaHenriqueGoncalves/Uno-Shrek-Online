import mongoose from "mongoose";
import GameOrchestrator from "../../../src/modules/game/game.orchestrator.js";
import PinoGlobal from "../../../src/modules/shared/logger/pino-global.logger.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";
import { NotFoundError } from "../../../src/modules/shared/errors/not-found.error.js";
import { GAME_STATUS } from "../../../src/modules/game/game.schema.js";
import GameEngine from "../../../src/modules/game/game.engine.js";
import { createDeck } from "../../../src/modules/game/util/deck.js";

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
  let scoreRepositoryMock;

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
    scoreRepositoryMock = orchestrator.scoreRepository;
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

  describe("draw", () => {
    const userId = "owner1";
    const gameId = "game1";

    function buildGame(overrides = {}) {
      return {
        _id: gameId,
        status: GAME_STATUS.ACTIVE,
        currentPlayer: userId,
        deck: ["deckCard1"],
        discard: ["discardCard1"],
        players: [
          { player: { toString: () => userId }, hand: { cards: ["handCard1"] } },
          { player: { toString: () => "player2" }, hand: { cards: [] } },
        ],
        ...overrides,
      };
    }

    function mockCardDocs() {
      cardRepositoryMock.getAllByIds.mockResolvedValue([
        { _id: "deckCard1", color: "red", type: "number", value: "1" },
        { _id: "discardCard1", color: "blue", type: "number", value: "2" },
        { _id: "handCard1", color: "green", type: "number", value: "3" },
      ]);
    }

    it("should draw a card and pass the turn to the next player", async () => {
      const game = buildGame();
      gameRepositoryMock.getById.mockResolvedValue(game);
      mockCardDocs();
      GameEngine.drawFromDeck.mockReturnValue({
        state: {
          deck: [],
          discard: [{ id: "discardCard1", color: "blue", type: "number", value: "2" }],
          players: [
            { player: userId, hand: { cards: [{ id: "handCard1", color: "green", type: "number", value: "3" }] } },
            { player: "player2", hand: { cards: [] } },
          ],
          currentPlayer: userId,
          direction: 1,
          activeColor: null,
        },
        drawn: [{ id: "deckCard1", color: "red", type: "number", value: "1" }],
      });
      gameRepositoryMock.update.mockResolvedValue(game);

      await orchestrator.draw(userId, gameId);

      expect(GameEngine.drawFromDeck).toHaveBeenCalledWith(
        expect.anything(),
        0,
        1,
      );
      expect(gameRepositoryMock.update).toHaveBeenCalled();
      expect(game.currentPlayer).toBe("player2");
    });

    it("should throw NotFoundError when the game does not exist", async () => {
      gameRepositoryMock.getById.mockResolvedValue(null);

      await expect(orchestrator.draw(userId, gameId)).rejects.toThrow(
        NotFoundError,
      );
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the game is not ACTIVE", async () => {
      const game = buildGame({ status: GAME_STATUS.PENDING });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(orchestrator.draw(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the player is not present in the game", async () => {
      const game = buildGame({
        players: [
          { player: { toString: () => "someoneElse" }, hand: { cards: [] } },
        ],
      });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(orchestrator.draw(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when it's not the player's turn", async () => {
      const game = buildGame({ currentPlayer: "player2" });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(orchestrator.draw(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("play", () => {
    const userId = "owner1";
    const gameId = "game1";
    const cardId = "handCard1";

    function buildGame(overrides = {}) {
      return {
        _id: gameId,
        status: GAME_STATUS.ACTIVE,
        currentPlayer: userId,
        deck: [],
        discard: ["discardCard1"],
        players: [
          { player: { toString: () => userId }, hand: { cards: [cardId] } },
          { player: { toString: () => "player2" }, hand: { cards: [] } },
        ],
        ...overrides,
      };
    }

    function mockCardDocs() {
      cardRepositoryMock.getAllByIds.mockResolvedValue([
        { _id: "discardCard1", color: "blue", type: "number", value: "2" },
        { _id: cardId, color: "blue", type: "number", value: "5" },
      ]);
    }

    it("should play a valid card and update the game", async () => {
      const game = buildGame();
      gameRepositoryMock.getById.mockResolvedValue(game);
      mockCardDocs();
      GameEngine.validatePlay.mockReturnValue(true);
      GameEngine.applyPlay.mockReturnValue({
        state: {
          deck: [],
          discard: [{ id: cardId, color: "blue", type: "number", value: "5" }],
          players: [
            { player: userId, hand: { cards: [] } },
            { player: "player2", hand: { cards: [] } },
          ],
          currentPlayer: "player2",
          direction: 1,
          activeColor: null,
        },
        drawnCards: [],
        effect: null,
      });
      gameRepositoryMock.update.mockResolvedValue(game);

      await orchestrator.play(userId, gameId, cardId);

      expect(GameEngine.validatePlay).toHaveBeenCalled();
      expect(GameEngine.applyPlay).toHaveBeenCalled();
      expect(gameRepositoryMock.update).toHaveBeenCalled();
      expect(game.currentPlayer).toBe("player2");
    });

    it("should throw BusinessError when the card is not in the player's hand", async () => {
      const game = buildGame();
      gameRepositoryMock.getById.mockResolvedValue(game);
      mockCardDocs();

      await expect(
        orchestrator.play(userId, gameId, "cardNotInHand"),
      ).rejects.toThrow(BusinessError);
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the play is invalid", async () => {
      const game = buildGame();
      gameRepositoryMock.getById.mockResolvedValue(game);
      mockCardDocs();
      GameEngine.validatePlay.mockReturnValue(false);

      await expect(
        orchestrator.play(userId, gameId, cardId),
      ).rejects.toThrow(BusinessError);
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when it's not the player's turn", async () => {
      const game = buildGame({ currentPlayer: "player2" });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(
        orchestrator.play(userId, gameId, cardId),
      ).rejects.toThrow(BusinessError);
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when the game does not exist", async () => {
      gameRepositoryMock.getById.mockResolvedValue(null);

      await expect(
        orchestrator.play(userId, gameId, cardId),
      ).rejects.toThrow(NotFoundError);
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the game is not ACTIVE", async () => {
      const game = buildGame({ status: GAME_STATUS.PENDING });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(
        orchestrator.play(userId, gameId, cardId),
      ).rejects.toThrow(BusinessError);
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the player is not present in the game", async () => {
      const game = buildGame({
        players: [
          { player: { toString: () => "someoneElse" }, hand: { cards: [] } },
        ],
      });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(
        orchestrator.play(userId, gameId, cardId),
      ).rejects.toThrow(BusinessError);
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("getFullGame", () => {
    const gameId = "game1";

    it("should return the full populated game", async () => {
      const game = { _id: gameId, status: GAME_STATUS.ACTIVE };
      gameRepositoryMock.getByIdPopulated.mockResolvedValue(game);

      const result = await orchestrator.getFullGame(gameId);

      expect(gameRepositoryMock.getByIdPopulated).toHaveBeenCalledWith(
        gameId,
        null,
      );
      expect(result).toEqual(game);
    });

    it("should throw NotFoundError when the game does not exist", async () => {
      gameRepositoryMock.getByIdPopulated.mockResolvedValue(null);

      await expect(orchestrator.getFullGame(gameId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("createScorePlayerFor", () => {
    const playerId = "player1";
    const gameId = "game1";

    it("should create the score player and bind it to the player's entry", async () => {
      const scorePlayer = { _id: "score1" };
      const game = {
        _id: gameId,
        players: [{ player: { toString: () => playerId } }],
      };
      const updatedGame = { ...game };

      scoreRepositoryMock.create.mockResolvedValue(scorePlayer);
      gameRepositoryMock.getById.mockResolvedValue(game);
      gameRepositoryMock.update.mockResolvedValue(updatedGame);

      const result = await orchestrator.createScorePlayerFor(
        playerId,
        gameId,
      );

      expect(scoreRepositoryMock.create).toHaveBeenCalledWith(
        { playerId, gameId, score: 0 },
        null,
      );
      expect(game.players[0].scorePlayer).toBe(scorePlayer._id);
      expect(gameRepositoryMock.update).toHaveBeenCalledWith(
        gameId,
        game,
        null,
      );
      expect(result).toEqual({ game: updatedGame, scorePlayer });
    });

    it("should throw NotFoundError when the game does not exist", async () => {
      scoreRepositoryMock.create.mockResolvedValue({ _id: "score1" });
      gameRepositoryMock.getById.mockResolvedValue(null);

      await expect(
        orchestrator.createScorePlayerFor(playerId, gameId),
      ).rejects.toThrow(NotFoundError);
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the player is not present in the game", async () => {
      scoreRepositoryMock.create.mockResolvedValue({ _id: "score1" });
      gameRepositoryMock.getById.mockResolvedValue({
        _id: gameId,
        players: [{ player: { toString: () => "someoneElse" } }],
      });

      await expect(
        orchestrator.createScorePlayerFor(playerId, gameId),
      ).rejects.toThrow(BusinessError);
      expect(gameRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("updateScore", () => {
    const playerId = "player1";
    const gameId = "game1";

    function buildGame(overrides = {}) {
      return {
        _id: gameId,
        players: [
          {
            player: { toString: () => playerId },
            scorePlayer: { toString: () => "score1" },
          },
        ],
        ...overrides,
      };
    }

    it("should update the player's score", async () => {
      const game = buildGame();
      const updatedScore = { _id: "score1", score: 15 };
      gameRepositoryMock.getById.mockResolvedValue(game);
      scoreRepositoryMock.update.mockResolvedValue(updatedScore);

      const result = await orchestrator.updateScore(playerId, gameId, 15);

      expect(scoreRepositoryMock.update).toHaveBeenCalledWith(
        "score1",
        { score: 15 },
        null,
      );
      expect(result).toEqual(updatedScore);
    });

    it("should throw NotFoundError when the game does not exist", async () => {
      gameRepositoryMock.getById.mockResolvedValue(null);

      await expect(
        orchestrator.updateScore(playerId, gameId, 15),
      ).rejects.toThrow(NotFoundError);
      expect(scoreRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the player is not present in the game", async () => {
      const game = buildGame({
        players: [{ player: { toString: () => "someoneElse" } }],
      });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(
        orchestrator.updateScore(playerId, gameId, 15),
      ).rejects.toThrow(BusinessError);
      expect(scoreRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the player has no scorePlayer bound to the game", async () => {
      const game = buildGame({
        players: [
          { player: { toString: () => playerId }, scorePlayer: null },
        ],
      });
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(
        orchestrator.updateScore(playerId, gameId, 15),
      ).rejects.toThrow(BusinessError);
      expect(scoreRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when the score is negative", async () => {
      const game = buildGame();
      gameRepositoryMock.getById.mockResolvedValue(game);

      await expect(
        orchestrator.updateScore(playerId, gameId, -1),
      ).rejects.toThrow(BusinessError);
      expect(scoreRepositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
