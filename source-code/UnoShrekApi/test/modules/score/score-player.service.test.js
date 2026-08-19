import ScorePlayerService from "../../../src/modules/score/score-player.service.js";
import ScorePlayerRepository from "../../../src/modules/score/score-player.repository.js";
import PinoGlobal from "../../../src/modules/shared/logger/pino-global.logger.js";
import { NotFoundError } from "../../../src/modules/shared/errors/not-found.error.js";
import { parseOrThrow } from "../../../src/modules/shared/utils/validate.js";
import { CreateScorePlayerRequestDto } from "../../../src/modules/score/dto/create-score-player.request.dto.js";
import { UpdateScorePlayerRequestDto } from "../../../src/modules/score/dto/update-score-player.request.dto.js";

jest.mock("../../../src/modules/score/score-player.repository.js");
jest.mock("../../../src/modules/shared/logger/pino-global.logger.js");
jest.mock("../../../src/modules/shared/utils/validate.js");

describe("ScorePlayerService", () => {
  let scorePlayerService;
  let scorePlayerRepositoryMock;
  let playerServiceMock;
  let gameServiceMock;
  let logMock;
  let schemaMock;

  beforeEach(() => {
    logMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    PinoGlobal.getInstance.mockReturnValue(logMock);

    schemaMock = {};

    scorePlayerRepositoryMock = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn(),
      getByGameId: jest.fn(),
    };
    ScorePlayerRepository.mockImplementation(() => scorePlayerRepositoryMock);

    playerServiceMock = {
      getById: jest.fn(),
    };

    gameServiceMock = {
      getById: jest.fn(),
    };

    scorePlayerService = new ScorePlayerService(
      schemaMock,
      playerServiceMock,
      gameServiceMock,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should instantiate ScorePlayerRepository with schema", () => {
      expect(ScorePlayerRepository).toHaveBeenCalledWith(schemaMock);
    });
  });

  describe("getAll", () => {
    it("should return all score players", async () => {
      const scores = [
        { _id: "1", playerId: "p1", gameId: "g1", score: 100 },
        { _id: "2", playerId: "p2", gameId: "g2", score: 200 },
      ];
      scorePlayerRepositoryMock.getAll.mockResolvedValue(scores);

      const result = await scorePlayerService.getAll();

      expect(scorePlayerRepositoryMock.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(scores);
    });

    it("should return empty array when no scores exist", async () => {
      scorePlayerRepositoryMock.getAll.mockResolvedValue([]);

      const result = await scorePlayerService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    const scoreId = "507f1f77bcf86cd799439011";

    it("should return score player by id", async () => {
      const score = { _id: scoreId, playerId: "p1", gameId: "g1", score: 100 };
      scorePlayerRepositoryMock.getById.mockResolvedValue(score);

      const result = await scorePlayerService.getById(scoreId);

      expect(scorePlayerRepositoryMock.getById).toHaveBeenCalledWith(scoreId);
      expect(result).toEqual(score);
    });

    it("should throw NotFoundError when score player not found", async () => {
      scorePlayerRepositoryMock.getById.mockResolvedValue(null);

      await expect(scorePlayerService.getById(scoreId)).rejects.toThrow(
        NotFoundError,
      );
      expect(logMock.warn).toHaveBeenCalled();
    });
  });

  describe("getByIdDetails", () => {
    const scoreId = "507f1f77bcf86cd799439011";

    it("should return score player with player and game details", async () => {
      const score = { _id: scoreId, playerId: "p1", gameId: "g1", score: 100 };
      const player = { _id: "p1", username: "player1" };
      const game = { _id: "g1", name: "game1" };

      scorePlayerRepositoryMock.getById.mockResolvedValue(score);
      playerServiceMock.getById.mockResolvedValue(player);
      gameServiceMock.getById.mockResolvedValue(game);

      const result = await scorePlayerService.getByIdDetails(scoreId);

      expect(scorePlayerRepositoryMock.getById).toHaveBeenCalledWith(scoreId);
      expect(playerServiceMock.getById).toHaveBeenCalledWith(score.playerId);
      expect(gameServiceMock.getById).toHaveBeenCalledWith(score.gameId);
      expect(result).toEqual({ score, player, game });
    });

    it("should throw NotFoundError when score player not found", async () => {
      scorePlayerRepositoryMock.getById.mockResolvedValue(null);

      await expect(scorePlayerService.getByIdDetails(scoreId)).rejects.toThrow(
        NotFoundError,
      );
      expect(playerServiceMock.getById).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const validData = {
      playerId: "507f1f77bcf86cd799439011",
      gameId: "507f1f77bcf86cd799439012",
      score: 100,
    };

    it("should create score player successfully", async () => {
      const player = { _id: validData.playerId, username: "player1" };
      const game = { _id: validData.gameId, name: "game1" };
      const createdScore = { _id: "new-score-id", ...validData };

      parseOrThrow.mockReturnValue(validData);
      playerServiceMock.getById.mockResolvedValue(player);
      gameServiceMock.getById.mockResolvedValue(game);
      scorePlayerRepositoryMock.create.mockResolvedValue(createdScore);

      const result = await scorePlayerService.create(validData);

      expect(parseOrThrow).toHaveBeenCalledWith(
        CreateScorePlayerRequestDto,
        validData,
      );
      expect(playerServiceMock.getById).toHaveBeenCalledWith(
        validData.playerId,
      );
      expect(gameServiceMock.getById).toHaveBeenCalledWith(validData.gameId);
      expect(scorePlayerRepositoryMock.create).toHaveBeenCalledWith(validData);
      expect(result).toEqual(createdScore);
    });

    it("should throw NotFoundError when player not found", async () => {
      parseOrThrow.mockReturnValue(validData);
      playerServiceMock.getById.mockResolvedValue(null);

      await expect(scorePlayerService.create(validData)).rejects.toThrow(
        "Player not found",
      );
      expect(gameServiceMock.getById).not.toHaveBeenCalled();
      expect(scorePlayerRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when game not found", async () => {
      const player = { _id: validData.playerId, username: "player1" };

      parseOrThrow.mockReturnValue(validData);
      playerServiceMock.getById.mockResolvedValue(player);
      gameServiceMock.getById.mockResolvedValue(null);

      await expect(scorePlayerService.create(validData)).rejects.toThrow(
        "Game not found",
      );
      expect(scorePlayerRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const scoreId = "507f1f77bcf86cd799439011";
    const updateData = { score: 150 };

    it("should update score player successfully", async () => {
      const existingScore = {
        _id: scoreId,
        playerId: "507f1f77bcf86cd799439012",
        gameId: "507f1f77bcf86cd799439013",
        score: 100,
      };
      const player = { _id: existingScore.playerId, username: "player1" };
      const game = { _id: existingScore.gameId, name: "game1" };
      const updatedScore = { ...existingScore, ...updateData };

      parseOrThrow.mockReturnValue(updateData);
      scorePlayerRepositoryMock.getById.mockResolvedValue(existingScore);
      playerServiceMock.getById.mockResolvedValue(player);
      gameServiceMock.getById.mockResolvedValue(game);
      scorePlayerRepositoryMock.update.mockResolvedValue(updatedScore);

      const result = await scorePlayerService.update(scoreId, updateData);

      expect(parseOrThrow).toHaveBeenCalledWith(
        UpdateScorePlayerRequestDto,
        updateData,
      );
      expect(scorePlayerRepositoryMock.update).toHaveBeenCalledWith(
        scoreId,
        updateData,
      );
      expect(result).toEqual(updatedScore);
    });

    it("should throw NotFoundError when score player not found", async () => {
      parseOrThrow.mockReturnValue(updateData);
      scorePlayerRepositoryMock.getById.mockResolvedValue(null);

      await expect(
        scorePlayerService.update(scoreId, updateData),
      ).rejects.toThrow("ScorePlayer not found");
      expect(scorePlayerRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteById", () => {
    const scoreId = "507f1f77bcf86cd799439011";

    it("should delete score player successfully", async () => {
      const existingScore = {
        _id: scoreId,
        playerId: "p1",
        gameId: "g1",
        score: 100,
      };
      scorePlayerRepositoryMock.getById.mockResolvedValue(existingScore);
      scorePlayerRepositoryMock.deleteById.mockResolvedValue(existingScore);

      const result = await scorePlayerService.deleteById(scoreId);

      expect(scorePlayerRepositoryMock.deleteById).toHaveBeenCalledWith(
        scoreId,
      );
      expect(result).toEqual(existingScore);
    });

    it("should throw NotFoundError when score player not found", async () => {
      scorePlayerRepositoryMock.getById.mockResolvedValue(null);

      await expect(scorePlayerService.deleteById(scoreId)).rejects.toThrow(
        "ScorePlayer not found",
      );
      expect(scorePlayerRepositoryMock.deleteById).not.toHaveBeenCalled();
    });
  });

  describe("getByGameId", () => {
    const gameId = "507f1f77bcf86cd799439011";

    it("should return scores with player details for a game", async () => {
      const game = { _id: gameId, name: "game1" };
      const scores = [
        { _id: "s1", playerId: "p1", gameId, score: 100 },
        { _id: "s2", playerId: "p2", gameId, score: 200 },
      ];
      const players = [
        { _id: "p1", username: "player1" },
        { _id: "p2", username: "player2" },
      ];

      gameServiceMock.getById.mockResolvedValue(game);
      scorePlayerRepositoryMock.getByGameId.mockResolvedValue(scores);
      playerServiceMock.getById
        .mockResolvedValueOnce(players[0])
        .mockResolvedValueOnce(players[1]);

      const result = await scorePlayerService.getByGameId(gameId);

      expect(gameServiceMock.getById).toHaveBeenCalledWith(gameId);
      expect(scorePlayerRepositoryMock.getByGameId).toHaveBeenCalledWith(
        gameId,
      );
      expect(playerServiceMock.getById).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        { score: scores[0], player: players[0], game },
        { score: scores[1], player: players[1], game },
      ]);
    });

    it("should throw NotFoundError when game not found", async () => {
      gameServiceMock.getById.mockRejectedValue(
        new NotFoundError("Game not found"),
      );

      await expect(scorePlayerService.getByGameId(gameId)).rejects.toThrow(
        "Game not found",
      );
      expect(scorePlayerRepositoryMock.getByGameId).not.toHaveBeenCalled();
    });

    it("should return empty array when no scores for game", async () => {
      const game = { _id: gameId, name: "game1" };

      gameServiceMock.getById.mockResolvedValue(game);
      scorePlayerRepositoryMock.getByGameId.mockResolvedValue([]);

      const result = await scorePlayerService.getByGameId(gameId);

      expect(result).toEqual([]);
      expect(playerServiceMock.getById).not.toHaveBeenCalled();
    });
  });
});
