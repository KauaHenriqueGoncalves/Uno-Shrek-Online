import ScorePlayerController from "../../../src/modules/score/score-player.controller.js";
import ScorePlayerResponseDto from "../../../src/modules/score/response/score-player.response.dto.js";

jest.mock(
  "../../../src/modules/score/response/score-player.response.dto.js",
);

describe("ScorePlayerController", () => {
  let controller;
  let serviceMock;
  let res;

  beforeEach(() => {
    serviceMock = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getByIdDetails: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn(),
    };

    controller = new ScorePlayerController(serviceMock);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all score players", async () => {
      const scores = [
        { _id: "1", playerId: "p1", gameId: "g1", score: 100 },
        { _id: "2", playerId: "p2", gameId: "g2", score: 200 },
      ];
      const responseDto = [
        { id: "1", score: 100 },
        { id: "2", score: 200 },
      ];

      serviceMock.getAll.mockResolvedValue(scores);
      ScorePlayerResponseDto.fromDocumentList.mockReturnValue(responseDto);

      await controller.getAll({}, res);

      expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
      expect(ScorePlayerResponseDto.fromDocumentList).toHaveBeenCalledWith(
        scores,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(responseDto);
    });
  });

  describe("getById", () => {
    it("should return score player by id", async () => {
      const scoreId = "507f1f77bcf86cd799439011";
      const score = { _id: scoreId, playerId: "p1", gameId: "g1", score: 100 };
      const responseDto = { id: scoreId, score: 100 };

      serviceMock.getById.mockResolvedValue(score);
      ScorePlayerResponseDto.fromDocument.mockReturnValue(responseDto);

      await controller.getById({ params: { id: scoreId } }, res);

      expect(serviceMock.getById).toHaveBeenCalledWith(scoreId);
      expect(ScorePlayerResponseDto.fromDocument).toHaveBeenCalledWith(score);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(responseDto);
    });
  });

  describe("getByIdDetails", () => {
    it("should return score player with details", async () => {
      const scoreId = "507f1f77bcf86cd799439011";
      const score = { _id: scoreId, playerId: "p1", gameId: "g1", score: 100 };
      const player = { _id: "p1", username: "player1" };
      const game = { _id: "g1", name: "game1" };
      const responseDto = { id: scoreId, score: 100, player: {}, game: {} };

      serviceMock.getByIdDetails.mockResolvedValue({ score, player, game });
      ScorePlayerResponseDto.fromDetails.mockReturnValue(responseDto);

      await controller.getByIdDetails({ params: { id: scoreId } }, res);

      expect(serviceMock.getByIdDetails).toHaveBeenCalledWith(scoreId);
      expect(ScorePlayerResponseDto.fromDetails).toHaveBeenCalledWith(
        score,
        player,
        game,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(responseDto);
    });
  });

  describe("create", () => {
    it("should create new score player", async () => {
      const payload = {
        playerId: "507f1f77bcf86cd799439011",
        gameId: "507f1f77bcf86cd799439012",
        score: 100,
      };
      const createdScore = { _id: "new-id", ...payload };
      const responseDto = { id: "new-id", ...payload };

      serviceMock.create.mockResolvedValue(createdScore);
      ScorePlayerResponseDto.fromDocument.mockReturnValue(responseDto);

      await controller.create({ body: payload }, res);

      expect(serviceMock.create).toHaveBeenCalledWith(payload);
      expect(ScorePlayerResponseDto.fromDocument).toHaveBeenCalledWith(
        createdScore,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(responseDto);
    });
  });

  describe("update", () => {
    it("should update existing score player", async () => {
      const scoreId = "507f1f77bcf86cd799439011";
      const updateData = { score: 150 };
      const updatedScore = { _id: scoreId, ...updateData };
      const responseDto = { id: scoreId, ...updateData };

      serviceMock.update.mockResolvedValue(updatedScore);
      ScorePlayerResponseDto.fromDocument.mockReturnValue(responseDto);

      await controller.update(
        { params: { id: scoreId }, body: updateData },
        res,
      );

      expect(serviceMock.update).toHaveBeenCalledWith(scoreId, updateData);
      expect(ScorePlayerResponseDto.fromDocument).toHaveBeenCalledWith(
        updatedScore,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(responseDto);
    });
  });

  describe("delete", () => {
    it("should delete score player", async () => {
      const scoreId = "507f1f77bcf86cd799439011";

      serviceMock.deleteById.mockResolvedValue({});

      await controller.delete({ params: { id: scoreId } }, res);

      expect(serviceMock.deleteById).toHaveBeenCalledWith(scoreId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith();
    });
  });
});
