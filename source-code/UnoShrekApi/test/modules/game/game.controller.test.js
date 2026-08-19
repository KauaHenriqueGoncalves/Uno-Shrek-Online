import GameController from "../../../src/modules/game/game.controller.js";
import GameResponseDto from "../../../src/modules/game/response/game.response.dto.js";

jest.mock("../../../src/modules/game/response/game.response.dto.js");
jest.mock("../../../src/modules/shared/middleware/auth.middleware.js", () =>
  jest.fn((req, res, next) => next()),
);

describe("GameController", () => {
  let controller;
  let serviceMock;
  let req;
  let res;

  beforeEach(() => {
    serviceMock = {
      getAll: jest.fn(),
      getAllByStatus: jest.fn(),
      getById: jest.fn(),
      getByIdInfo: jest.fn(),
      create: jest.fn(),
      joinInGame: jest.fn(),
      leaveGame: jest.fn(),
      readyInGame: jest.fn(),
      notReadyInGame: jest.fn(),
      updatePlayerScore: jest.fn(),
      startGame: jest.fn(),
      draw: jest.fn(),
      play: jest.fn(),
      finishedGame: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn(),
    };

    controller = new GameController(serviceMock);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all games with status 200", async () => {
      req = {};
      const games = [{ _id: "1" }];
      serviceMock.getAll.mockResolvedValue(games);
      GameResponseDto.fromDocumentList.mockReturnValue([{ id: "1" }]);

      await controller.getAll(req, res);

      expect(serviceMock.getAll).toHaveBeenCalled();
      expect(GameResponseDto.fromDocumentList).toHaveBeenCalledWith(games);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: "1" }]);
    });
  });

  describe("getAllByStatus", () => {
    it("should return games filtered by status", async () => {
      req = { params: { status: "waiting" } };
      const games = [{ _id: "1" }];
      serviceMock.getAllByStatus.mockResolvedValue(games);
      GameResponseDto.fromDocumentList.mockReturnValue([{ id: "1" }]);

      await controller.getAllByStatus(req, res);

      expect(serviceMock.getAllByStatus).toHaveBeenCalledWith("waiting");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: "1" }]);
    });
  });

  describe("getById", () => {
    it("should return the game room by id", async () => {
      req = { params: { id: "game1" } };
      const game = { _id: "game1" };
      serviceMock.getByIdInfo.mockResolvedValue({ game });
      GameResponseDto.fromDocumentRoom.mockReturnValue({ id: "game1" });

      await controller.getById(req, res);

      expect(serviceMock.getByIdInfo).toHaveBeenCalledWith("game1");
      expect(GameResponseDto.fromDocumentRoom).toHaveBeenCalledWith(game);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "game1" });
    });
  });

  describe("getStatusById", () => {
    it("should return the game status", async () => {
      req = { params: { id: "game1" } };
      const game = { _id: "game1", status: "waiting" };
      serviceMock.getById.mockResolvedValue(game);
      GameResponseDto.fromDocumentStatus.mockReturnValue({
        id: "game1",
        status: "waiting",
      });

      await controller.getStatusById(req, res);

      expect(serviceMock.getById).toHaveBeenCalledWith("game1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: "game1",
        status: "waiting",
      });
    });
  });

  describe("getCurrentPlayersById", () => {
    it("should return the current players", async () => {
      req = { params: { id: "game1" } };
      const game = { _id: "game1" };
      serviceMock.getByIdInfo.mockResolvedValue({ game });
      GameResponseDto.fromDocumentCurrentPlayers.mockReturnValue({
        id: "game1",
        players: [],
      });

      await controller.getCurrentPlayersById(req, res);

      expect(serviceMock.getByIdInfo).toHaveBeenCalledWith("game1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "game1", players: [] });
    });
  });

  describe("getCurrentPlayerById", () => {
    it("should return the current player", async () => {
      req = { params: { id: "game1" } };
      const game = { _id: "game1" };
      serviceMock.getByIdInfo.mockResolvedValue({ game });
      GameResponseDto.fromDocumentCurrentPlayer.mockReturnValue({
        id: "game1",
        currentPlayer: "p1",
      });

      await controller.getCurrentPlayerById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: "game1",
        currentPlayer: "p1",
      });
    });
  });

  describe("getTopCardById", () => {
    it("should return the top card", async () => {
      req = { params: { id: "game1" } };
      const game = { _id: "game1" };
      serviceMock.getByIdInfo.mockResolvedValue({ game });
      GameResponseDto.fromDocumentTopCard.mockReturnValue({
        id: "game1",
        topCard: { color: "red" },
      });

      await controller.getTopCardById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: "game1",
        topCard: { color: "red" },
      });
    });
  });

  describe("getCurrentScoreById", () => {
    it("should return the current score", async () => {
      req = { params: { id: "game1" } };
      const game = { _id: "game1" };
      serviceMock.getByIdInfo.mockResolvedValue({ game });
      GameResponseDto.fromDocumentCurrentScore.mockReturnValue({
        id: "game1",
        scores: [],
      });

      await controller.getCurrentScoreById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "game1", scores: [] });
    });
  });

  describe("create", () => {
    it("should create a game and return 201", async () => {
      req = { user: { id: "user1" }, body: { title: "My Game" } };
      const game = { _id: "game1" };
      serviceMock.create.mockResolvedValue(game);

      await controller.create(req, res);

      expect(serviceMock.create).toHaveBeenCalledWith("user1", req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Game created successfully",
        gameId: "game1",
      });
    });
  });

  describe("joinInGame", () => {
    it("should join the game and return 200", async () => {
      req = { user: { id: "user1" }, body: { gameId: "game1", password: "12345678" } };
      serviceMock.joinInGame.mockResolvedValue({});

      await controller.joinInGame(req, res);

      expect(serviceMock.joinInGame).toHaveBeenCalledWith("user1", "game1", "12345678");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User joined the game successfully",
      });
    });
  });

  describe("leaveGame", () => {
    it("should leave the game and return 200", async () => {
      req = { user: { id: "user1" }, body: { gameId: "game1" } };
      serviceMock.leaveGame.mockResolvedValue({});

      await controller.leaveGame(req, res);

      expect(serviceMock.leaveGame).toHaveBeenCalledWith("user1", "game1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User leave the game successfully",
      });
    });
  });

  describe("readyInGame", () => {
    it("should mark player as ready and return 200", async () => {
      req = { user: { id: "user1" }, body: { gameId: "game1" } };
      serviceMock.readyInGame.mockResolvedValue({});

      await controller.readyInGame(req, res);

      expect(serviceMock.readyInGame).toHaveBeenCalledWith("user1", "game1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Player is ready" });
    });
  });

  describe("notReadyInGame", () => {
    it("should mark player as not ready and return 200", async () => {
      req = { user: { id: "user1" }, body: { gameId: "game1" } };
      serviceMock.notReadyInGame.mockResolvedValue({});

      await controller.notReadyInGame(req, res);

      expect(serviceMock.notReadyInGame).toHaveBeenCalledWith("user1", "game1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Player is not ready",
      });
    });
  });

  describe("updatePlayerScore", () => {
    it("should update the player score and return 200", async () => {
      req = {
        user: { id: "user1" },
        params: { id: "game1" },
        body: { score: 10 },
      };
      serviceMock.updatePlayerScore.mockResolvedValue({ _id: "game1" });

      await controller.updatePlayerScore(req, res);

      expect(serviceMock.updatePlayerScore).toHaveBeenCalledWith(
        "user1",
        "game1",
        10,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Player score updated",
        gameId: "game1",
      });
    });
  });

  describe("startGame", () => {
    it("should start the game and return 200", async () => {
      req = { user: { id: "user1" }, body: { gameId: "game1" } };
      serviceMock.startGame.mockResolvedValue({});

      await controller.startGame(req, res);

      expect(serviceMock.startGame).toHaveBeenCalledWith("user1", "game1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Game started successfully",
      });
    });
  });

  describe("draw", () => {
    it("should draw a card and return 200", async () => {
      req = { user: { id: "user1" }, params: { id: "game1" } };
      serviceMock.draw.mockResolvedValue({ _id: "game1" });

      await controller.draw(req, res);

      expect(serviceMock.draw).toHaveBeenCalledWith("user1", "game1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Drew a card",
        gameId: "game1",
      });
    });
  });

  describe("play", () => {
    it("should play a card with color choice and return 200", async () => {
      req = {
        user: { id: "user1" },
        params: { id: "game1" },
        body: { cardId: "card1", colorChoice: "blue" },
      };
      serviceMock.play.mockResolvedValue({ _id: "game1" });

      await controller.play(req, res);

      expect(serviceMock.play).toHaveBeenCalledWith(
        "user1",
        "game1",
        "card1",
        "blue",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Card played",
        gameId: "game1",
      });
    });

    it("should default colorChoice to null when not provided", async () => {
      req = {
        user: { id: "user1" },
        params: { id: "game1" },
        body: { cardId: "card1" },
      };
      serviceMock.play.mockResolvedValue({ _id: "game1" });

      await controller.play(req, res);

      expect(serviceMock.play).toHaveBeenCalledWith(
        "user1",
        "game1",
        "card1",
        null,
      );
    });
  });

  describe("finishedGame", () => {
    it("should finish the game and return 200", async () => {
      req = { user: { id: "user1" }, body: { gameId: "game1" } };
      serviceMock.finishedGame.mockResolvedValue({});

      await controller.finishedGame(req, res);

      expect(serviceMock.finishedGame).toHaveBeenCalledWith("user1", "game1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Game ended successfully",
      });
    });
  });

  describe("update", () => {
    it("should update the game and return 200", async () => {
      req = { params: { id: "game1" }, body: { title: "New Title" } };
      const updatedGame = { _id: "game1", title: "New Title" };
      serviceMock.update.mockResolvedValue(updatedGame);
      GameResponseDto.fromDocument.mockReturnValue({
        id: "game1",
        title: "New Title",
      });

      await controller.update(req, res);

      expect(serviceMock.update).toHaveBeenCalledWith("game1", req.body);
      expect(GameResponseDto.fromDocument).toHaveBeenCalledWith(updatedGame);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: "game1",
        title: "New Title",
      });
    });
  });

  describe("delete", () => {
    it("should delete the game and return 204", async () => {
      req = { params: { id: "game1" } };
      serviceMock.deleteById.mockResolvedValue({});

      await controller.delete(req, res);

      expect(serviceMock.deleteById).toHaveBeenCalledWith("game1");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith();
    });
  });
});
