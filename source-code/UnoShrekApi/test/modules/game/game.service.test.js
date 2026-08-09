import GameService from "../../../src/modules/game/game.service.js";
import GameRepository from "../../../src/modules/game/game.repository.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";
import { NotFoundError } from "../../../src/modules/shared/errors/not-found.error.js";
import { GAME_STATUS } from "../../../src/modules/game/game.schema.js";

jest.mock("../../../src/modules/game/game.repository.js");

describe("GameService", () => {
  let gameService;
  let repositoryMock;

  const mockOrchestrator = {
    createScorePlayerFor: jest.fn(),
    getFullGame: jest.fn(),
    start: jest.fn(),
    draw: jest.fn(),
    play: jest.fn(),
    updateScore: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    gameService = new GameService({}, mockOrchestrator);
    repositoryMock = gameService.gameRepository;

    jest.spyOn(gameService.log, "info").mockImplementation(() => {});
    jest.spyOn(gameService.log, "warn").mockImplementation(() => {});
  });

  describe("create", () => {
    const userId = "user_123";
    const validGameData = { title: "Sala de Davi", maxPlayers: 4 };

    const savedGame = {
      _id: "game_456",
      title: "Sala de Davi",
      owner: userId,
      status: "pending",
    };

    test("should successfully create a game (Happy Path)", async () => {
      jest
        .spyOn(GameRepository.prototype, "getActiveGameByOwner")
        .mockResolvedValue(null);
      jest
        .spyOn(GameRepository.prototype, "create")
        .mockResolvedValue(savedGame);

      const gameFinal = { ...savedGame, scoreCreated: true };
      mockOrchestrator.createScorePlayerFor.mockResolvedValue({
        game: gameFinal,
      });

      const result = await gameService.create(userId, validGameData);

      expect(mockOrchestrator.createScorePlayerFor).toHaveBeenCalledWith(
        userId,
        savedGame._id,
      );
      expect(result).toEqual(gameFinal);
    });

    test("should throw an error if owner already has an active game", async () => {
      jest
        .spyOn(GameRepository.prototype, "getActiveGameByOwner")
        .mockResolvedValue({ _id: "jogo_em_andamento" });

      await expect(gameService.create(userId, validGameData)).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("read", () => {
    const savedGame = {
      _id: "game_456",
      title: "Sala de Davi",
      owner: "user_123",
      status: "pending",
    };

    test("should return a game by id", async () => {
      jest
        .spyOn(GameRepository.prototype, "getById")
        .mockResolvedValue(savedGame);

      const result = await gameService.getById(savedGame._id);

      expect(result).toEqual(savedGame);
    });

    test("should throw when retrieving a non-existing game", async () => {
      jest.spyOn(GameRepository.prototype, "getById").mockResolvedValue(null);

      await expect(gameService.getById("missing_game")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getAll", () => {
    it("should return the list of games", async () => {
      const games = [{ _id: "game1" }, { _id: "game2" }];
      repositoryMock.getAll.mockResolvedValue(games);

      const result = await gameService.getAll();

      expect(repositoryMock.getAll).toHaveBeenCalled();
      expect(result).toEqual(games);
    });
  });

  describe("getByIdInfo", () => {
    const gameId = "game1";

    it("should return the full game", async () => {
      const game = { _id: gameId, status: GAME_STATUS.ACTIVE };
      mockOrchestrator.getFullGame.mockResolvedValue(game);

      const result = await gameService.getByIdInfo(gameId);

      expect(mockOrchestrator.getFullGame).toHaveBeenCalledWith(gameId);
      expect(result).toEqual({ game });
    });

    it("should throw NotFoundError when game does not exist", async () => {
      mockOrchestrator.getFullGame.mockRejectedValue(
        new NotFoundError("Game not found"),
      );

      await expect(gameService.getByIdInfo(gameId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getAllByStatus", () => {
    it("should return the games filtered by status", async () => {
      const games = [{ _id: "game1", status: GAME_STATUS.PENDING }];
      repositoryMock.getAllByStatus.mockResolvedValue(games);

      const result = await gameService.getAllByStatus(GAME_STATUS.PENDING);

      expect(repositoryMock.getAllByStatus).toHaveBeenCalledWith(
        GAME_STATUS.PENDING,
      );
      expect(result).toEqual(games);
    });
  });

  describe("update", () => {
    const savedGame = {
      _id: "game_456",
      title: "Sala de Davi",
      owner: "user_123",
      status: "pending",
    };

    test("should update a game successfully", async () => {
      jest
        .spyOn(GameRepository.prototype, "getById")
        .mockResolvedValue(savedGame);
      jest
        .spyOn(GameRepository.prototype, "update")
        .mockResolvedValue({ ...savedGame, title: "Nova sala" });

      const result = await gameService.update(savedGame._id, {
        title: "Nova sala",
      });

      expect(result.title).toBe("Nova sala");
    });
  });

  describe("delete", () => {
    const savedGame = {
      _id: "game_456",
      title: "Sala de Davi",
      owner: "user_123",
      status: "pending",
    };

    test("should delete a game successfully", async () => {
      jest
        .spyOn(GameRepository.prototype, "getById")
        .mockResolvedValue(savedGame);
      jest
        .spyOn(GameRepository.prototype, "deleteById")
        .mockResolvedValue(true);

      const result = await gameService.deleteById(savedGame._id);

      expect(result).toBe(true);
    });

    test("should throw when deleting a non-existing game", async () => {
      jest.spyOn(GameRepository.prototype, "getById").mockResolvedValue(null);

      await expect(gameService.deleteById("missing_game")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("joinInGame", () => {
    const userId = "player2";
    const gameId = "game1";

    function buildGame(overrides = {}) {
      return {
        _id: gameId,
        status: GAME_STATUS.PENDING,
        maxPlayers: 4,
        players: [{ player: { toString: () => "owner1" } }],
        ...overrides,
      };
    }

    it("should add the player to the game", async () => {
      const game = buildGame();

      repositoryMock.getById.mockResolvedValue(game);
      repositoryMock.update.mockResolvedValue(game);
      mockOrchestrator.createScorePlayerFor.mockResolvedValue({ game });

      const result = await gameService.joinInGame(userId, gameId);

      expect(repositoryMock.update).toHaveBeenCalledWith(gameId, game);
      expect(mockOrchestrator.createScorePlayerFor).toHaveBeenCalledWith(
        userId,
        gameId,
      );
      expect(result).toEqual(game);
    });

    it("should throw BusinessError when game is not PENDING", async () => {
      const game = buildGame({ status: GAME_STATUS.ACTIVE });
      repositoryMock.getById.mockResolvedValue(game);

      await expect(gameService.joinInGame(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when game is full", async () => {
      const game = buildGame({
        maxPlayers: 1,
        players: [{ player: { toString: () => "owner1" } }],
      });
      repositoryMock.getById.mockResolvedValue(game);

      await expect(gameService.joinInGame(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when player already joined the game", async () => {
      const game = buildGame({
        players: [{ player: { toString: () => userId } }],
      });
      repositoryMock.getById.mockResolvedValue(game);

      await expect(gameService.joinInGame(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("leaveGame", () => {
    const gameId = "game1";

    it("should remove the player from the game", async () => {
      const ownerId = "owner1";
      const otherId = "player2";
      const game = {
        _id: gameId,
        owner: { toString: () => ownerId },
        players: [
          { player: { toString: () => ownerId } },
          { player: { toString: () => otherId } },
        ],
      };
      repositoryMock.getById.mockResolvedValue(game);
      repositoryMock.update.mockResolvedValue(game);

      const result = await gameService.leaveGame(otherId, gameId);

      expect(game.players).toHaveLength(1);
      expect(repositoryMock.update).toHaveBeenCalledWith(gameId, game);
      expect(result).toEqual(game);
    });

    it("should transfer ownership when the owner leaves and players remain", async () => {
      const ownerId = "owner1";
      const nextOwnerId = "player2";
      const game = {
        _id: gameId,
        owner: { toString: () => ownerId },
        status: GAME_STATUS.PENDING,
        players: [
          { player: { toString: () => ownerId } },
          { player: { toString: () => nextOwnerId } },
        ],
      };
      repositoryMock.getById.mockResolvedValue(game);
      repositoryMock.update.mockResolvedValue(game);

      await gameService.leaveGame(ownerId, gameId);

      expect(game.owner.toString()).toBe(nextOwnerId);
      expect(game.status).toBe(GAME_STATUS.PENDING);
    });

    it("should finish the game when the owner leaves with no players remaining", async () => {
      const ownerId = "owner1";
      const game = {
        _id: gameId,
        owner: { toString: () => ownerId },
        status: GAME_STATUS.PENDING,
        players: [{ player: { toString: () => ownerId } }],
      };
      repositoryMock.getById.mockResolvedValue(game);
      repositoryMock.update.mockResolvedValue(game);

      await gameService.leaveGame(ownerId, gameId);

      expect(game.status).toBe(GAME_STATUS.FINISHED);
    });

    it("should throw BusinessError when player is not present in the game", async () => {
      const game = {
        _id: gameId,
        owner: { toString: () => "owner1" },
        players: [{ player: { toString: () => "owner1" } }],
      };
      repositoryMock.getById.mockResolvedValue(game);

      await expect(gameService.leaveGame("ghost", gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("readyInGame", () => {
    const gameId = "game1";
    const userId = "player1";

    it("should mark the player as ready", async () => {
      const game = {
        _id: gameId,
        players: [{ player: { toString: () => userId }, ready: false }],
      };
      repositoryMock.getById.mockResolvedValue(game);
      repositoryMock.update.mockResolvedValue(game);

      await gameService.readyInGame(userId, gameId);

      expect(game.players[0].ready).toBe(true);
      expect(repositoryMock.update).toHaveBeenCalledWith(gameId, game);
    });

    it("should throw BusinessError when player is not present in the game", async () => {
      const game = {
        _id: gameId,
        players: [{ player: { toString: () => "someoneElse" }, ready: false }],
      };
      repositoryMock.getById.mockResolvedValue(game);

      await expect(gameService.readyInGame(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("notReadyInGame", () => {
    const gameId = "game1";
    const userId = "player1";

    it("should mark the player as not ready", async () => {
      const game = {
        _id: gameId,
        players: [{ player: { toString: () => userId }, ready: true }],
      };
      repositoryMock.getById.mockResolvedValue(game);
      repositoryMock.update.mockResolvedValue(game);

      await gameService.notReadyInGame(userId, gameId);

      expect(game.players[0].ready).toBe(false);
      expect(repositoryMock.update).toHaveBeenCalledWith(gameId, game);
    });

    it("should throw BusinessError when player is not present in the game", async () => {
      const game = {
        _id: gameId,
        players: [{ player: { toString: () => "someoneElse" }, ready: true }],
      };
      repositoryMock.getById.mockResolvedValue(game);

      await expect(gameService.notReadyInGame(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("updatePlayerScore", () => {
    const gameId = "game1";
    const userId = "player1";

    it("should delegate score update to the orchestrator", async () => {
      const updatedGame = { _id: gameId };
      mockOrchestrator.updateScore.mockResolvedValue(updatedGame);

      const result = await gameService.updatePlayerScore(userId, gameId, 10);

      expect(mockOrchestrator.updateScore).toHaveBeenCalledWith(
        userId,
        gameId,
        10,
      );
      expect(result).toEqual(updatedGame);
    });

    it("should propagate the error thrown by the orchestrator", async () => {
      mockOrchestrator.updateScore.mockRejectedValue(
        new BusinessError("Score must be a non-negative number"),
      );

      await expect(
        gameService.updatePlayerScore(userId, gameId, -5),
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("startGame", () => {
    const gameId = "game1";
    const userId = "owner1";

    it("should delegate the start to the orchestrator", async () => {
      const startedGame = { _id: gameId, status: GAME_STATUS.ACTIVE };
      mockOrchestrator.start.mockResolvedValue(startedGame);

      const result = await gameService.startGame(userId, gameId);

      expect(mockOrchestrator.start).toHaveBeenCalledWith(userId, gameId);
      expect(result).toEqual(startedGame);
    });

    it("should propagate the error thrown by the orchestrator", async () => {
      mockOrchestrator.start.mockRejectedValue(
        new BusinessError("All players must be ready."),
      );

      await expect(gameService.startGame(userId, gameId)).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("finishedGame", () => {
    const gameId = "game1";
    const ownerId = "owner1";

    it("should finish the game", async () => {
      const game = {
        _id: gameId,
        owner: { toString: () => ownerId },
        status: GAME_STATUS.ACTIVE,
      };
      repositoryMock.getById.mockResolvedValue(game);
      repositoryMock.update.mockResolvedValue({
        ...game,
        status: GAME_STATUS.FINISHED,
      });

      const result = await gameService.finishedGame(ownerId, gameId);

      expect(repositoryMock.update).toHaveBeenCalledWith(
        gameId,
        expect.objectContaining({ status: GAME_STATUS.FINISHED }),
      );
      expect(result.status).toBe(GAME_STATUS.FINISHED);
    });

    it("should throw BusinessError when caller is not the owner", async () => {
      const game = {
        _id: gameId,
        owner: { toString: () => ownerId },
        status: GAME_STATUS.ACTIVE,
      };
      repositoryMock.getById.mockResolvedValue(game);

      await expect(
        gameService.finishedGame("intruder", gameId),
      ).rejects.toThrow(BusinessError);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when game is not ACTIVE", async () => {
      const game = {
        _id: gameId,
        owner: { toString: () => ownerId },
        status: GAME_STATUS.PENDING,
      };
      repositoryMock.getById.mockResolvedValue(game);

      await expect(gameService.finishedGame(ownerId, gameId)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
