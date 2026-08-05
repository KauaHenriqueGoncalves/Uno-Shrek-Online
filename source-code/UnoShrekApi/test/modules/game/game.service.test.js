import GameService from "../../../src/modules/game/game.service.js";
import PinoGlobal from "../../../src/modules/shared/logger/pino-global.logger.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";
import { NotFoundError } from "../../../src/modules/shared/errors/not-found.error.js";
import { GAME_STATUS } from "../../../src/modules/game/game.schema.js";
import { parseOrThrow } from "../../../src/modules/shared/utils/validate.js";

jest.mock("../../../src/modules/game/game.repository.js");
jest.mock("../../../src/modules/shared/logger/pino-global.logger.js");
jest.mock("../../../src/modules/shared/utils/validate.js");

describe("GameService", () => {
  let gameService;
  let repositoryMock;
  let orchestratorMock;

  beforeEach(() => {
    PinoGlobal.getInstance.mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    });
    orchestratorMock = {
      createScorePlayerFor: jest.fn(),
      getFullGame: jest.fn(),
    };
    gameService = new GameService({}, orchestratorMock);
    repositoryMock = gameService.gameRepository;
  });

  describe("create", () => {
    const userId = "owner1";
    const data = { title: "Jogo", maxPlayers: 4 };

    it("should create the game and the owner's ScorePlayer", async () => {
      const createdGame = {
        _id: "game1",
        ...data,
        owner: userId,
        players: [{ player: userId, ready: false }],
      };
      const gameWithScore = {
        ...createdGame,
        players: [{ player: userId, ready: false, scorePlayer: "score1" }],
      };

      parseOrThrow.mockReturnValue(data);
      repositoryMock.getActiveGameByOwner.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue(createdGame);
      orchestratorMock.createScorePlayerFor.mockResolvedValue({
        game: gameWithScore,
        scorePlayer: { _id: "score1" },
      });

      const result = await gameService.create(userId, data);

      expect(repositoryMock.getActiveGameByOwner).toHaveBeenCalledWith(
        userId,
      );
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ owner: userId }),
      );
      expect(orchestratorMock.createScorePlayerFor).toHaveBeenCalledWith(
        userId,
        createdGame._id.toString(),
      );
      expect(result).toEqual(gameWithScore);
    });

    it("should throw BusinessError when owner already has an active game", async () => {
      parseOrThrow.mockReturnValue(data);
      repositoryMock.getActiveGameByOwner.mockResolvedValue({
        _id: "activeGame",
      });

      await expect(gameService.create(userId, data)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.create).not.toHaveBeenCalled();
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
      orchestratorMock.createScorePlayerFor.mockResolvedValue({ game });

      const result = await gameService.joinInGame(userId, gameId);

      expect(repositoryMock.update).toHaveBeenCalledWith(gameId, game);
      expect(orchestratorMock.createScorePlayerFor).toHaveBeenCalledWith(
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

      await expect(
        gameService.finishedGame(ownerId, gameId),
      ).rejects.toThrow(BusinessError);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("getByIdInfo", () => {
    const gameId = "game1";

    it("should return the full game", async () => {
      const game = { _id: gameId, status: GAME_STATUS.ACTIVE };
      orchestratorMock.getFullGame.mockResolvedValue(game);

      const result = await gameService.getByIdInfo(gameId);

      expect(orchestratorMock.getFullGame).toHaveBeenCalledWith(gameId);
      expect(result).toEqual({ game });
    });

    it("should throw NotFoundError when game does not exist", async () => {
      orchestratorMock.getFullGame.mockRejectedValue(
        new NotFoundError("Game not found"),
      );

      await expect(gameService.getByIdInfo(gameId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
