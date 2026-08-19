import GameOrchestrator from "../../../src/modules/game/game.orchestrator.js";
import GameEngine from "../../../src/modules/game/game.engine.js";
import { GAME_STATUS } from "../../../src/modules/game/game.schema.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";
import { NotFoundError } from "../../../src/modules/shared/errors/not-found.error.js";
import { createDeck } from "../../../src/modules/game/util/deck.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

jest.mock("../../../src/modules/game/game.repository.js", () => {
  return jest.fn().mockImplementation(() => ({
    getByIdPopulated: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
  }));
});

jest.mock("../../../src/modules/score/score-player.repository.js", () => {
  return jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    update: jest.fn(),
  }));
});

jest.mock("../../../src/modules/player/player.repository.js", () => {
  return jest.fn().mockImplementation(() => ({
    create: jest.fn(),
  }));
});

jest.mock("../../../src/modules/card/card.repository.js", () => {
  return jest.fn().mockImplementation(() => ({
    createMany: jest.fn(),
  }));
});

jest.mock("../../../src/modules/game/mapper/game-state.mapper.js", () => {
  return jest.fn().mockImplementation(() => ({
    toEngineState: jest.fn(),
    applyEngineStateToGame: jest.fn(),
  }));
});

jest.mock("../../../src/modules/shared/mongoose/transaction-runner.js", () => {
  return jest.fn().mockImplementation(() => ({
    run: jest.fn((cb) => cb("fake-session")),
  }));
});

jest.mock("../../../src/modules/game/bot/uno.bot.js", () => {
  return jest.fn().mockImplementation(() => ({
    choosePlay: jest.fn(),
  }));
});

jest.mock("../../../src/modules/shared/logger/pino-global.logger.js", () => ({
  getInstance: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("../../../src/modules/game/game.engine.js", () => ({
  drawFromDeck: jest.fn(),
  applyPlay: jest.fn(),
  validatePlay: jest.fn(),
  startGameState: jest.fn(),
}));

jest.mock("../../../src/modules/game/util/deck.js", () => ({
  createDeck: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("crypto", () => ({
  randomUUID: jest.fn(),
}));

describe("GameOrchestrator", () => {
  let orchestrator;

  const buildGame = (over = {}) => ({
    _id: "game1",
    owner: "owner1",
    status: GAME_STATUS.PENDING,
    maxPlayers: 4,
    players: [],
    currentPlayer: null,
    ...over,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new GameOrchestrator({}, {}, {}, {});
  });

  describe("getFullGame", () => {
    it("returns the populated game when found", async () => {
      const game = buildGame();
      orchestrator.gameRepository.getByIdPopulated.mockResolvedValue(game);
      const result = await orchestrator.getFullGame("game1");
      expect(result).toBe(game);
      expect(orchestrator.gameRepository.getByIdPopulated).toHaveBeenCalledWith(
        "game1",
        null,
      );
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.gameRepository.getByIdPopulated.mockResolvedValue(null);
      await expect(orchestrator.getFullGame("game1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("createScorePlayerFor", () => {
    it("creates a score player and links it to the matching player entry", async () => {
      const scorePlayer = { _id: "score1" };
      orchestrator.scoreRepository.create.mockResolvedValue(scorePlayer);

      const game = buildGame({
        players: [{ player: { toString: () => "player1" } }],
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);

      const result = await orchestrator.createScorePlayerFor(
        "player1",
        "game1",
      );

      expect(game.players[0].scorePlayer).toBe("score1");
      expect(orchestrator.gameRepository.update).toHaveBeenCalledWith(
        "game1",
        game,
        null,
      );
      expect(result).toEqual({ game, scorePlayer });
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.scoreRepository.create.mockResolvedValue({ _id: "s1" });
      orchestrator.gameRepository.getById.mockResolvedValue(null);

      await expect(
        orchestrator.createScorePlayerFor("player1", "game1"),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws BusinessError when the player is not present in the game", async () => {
      orchestrator.scoreRepository.create.mockResolvedValue({ _id: "s1" });
      const game = buildGame({ players: [] });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(
        orchestrator.createScorePlayerFor("player1", "game1"),
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("updateScore", () => {
    const buildGameWithScorePlayer = (scorePlayer = "score1") =>
      buildGame({
        players: [
          {
            player: { toString: () => "player1" },
            scorePlayer,
          },
        ],
      });

    it("updates the score for a player with a valid scorePlayer binding", async () => {
      const game = buildGameWithScorePlayer();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.scoreRepository.update.mockResolvedValue({ score: 10 });

      const result = await orchestrator.updateScore("player1", "game1", 10);

      expect(orchestrator.scoreRepository.update).toHaveBeenCalledWith(
        "score1",
        { score: 10 },
        null,
      );
      expect(result).toEqual({ score: 10 });
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.gameRepository.getById.mockResolvedValue(null);

      await expect(
        orchestrator.updateScore("player1", "game1", 10),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws BusinessError when the player is not present in the game", async () => {
      const game = buildGame({ players: [] });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(
        orchestrator.updateScore("player1", "game1", 10),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when the player has no scorePlayer bound", async () => {
      const game = buildGameWithScorePlayer(null);
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(
        orchestrator.updateScore("player1", "game1", 10),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when score is negative", async () => {
      const game = buildGameWithScorePlayer();
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(
        orchestrator.updateScore("player1", "game1", -5),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when score is not a number", async () => {
      const game = buildGameWithScorePlayer();
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(
        orchestrator.updateScore("player1", "game1", "10"),
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("createBotPlayer", () => {
    it("creates a new Player document with generated username, email and hashed password", async () => {
      crypto.randomUUID.mockReturnValue("abcdefgh-1234");
      bcrypt.hash.mockResolvedValue("hashed-pass");
      const createdPlayer = { _id: "bot1", username: "ShrekBot_abcdefgh" };
      orchestrator.playerRepository.create.mockResolvedValue(createdPlayer);

      const result = await orchestrator.createBotPlayer("game1");

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(orchestrator.playerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          age: 18,
          password: "hashed-pass",
        }),
        null,
      );
      expect(result).toBe(createdPlayer);
    });
  });

  describe("addBotToGame", () => {
    const setupBotCreation = () => {
      const bot = { _id: "bot1", username: "ShrekBot_x" };
      orchestrator.createBotPlayer = jest.fn().mockResolvedValue(bot);
      orchestrator.createScorePlayerFor = jest.fn().mockResolvedValue({});
      return bot;
    };

    it("adds a bot player to a pending game and marks it ready and isBot=true", async () => {
      const bot = setupBotCreation();
      const game = buildGame({ players: [], maxPlayers: 4 });
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);

      await orchestrator.addBotToGame("game1");

      expect(game.players[0]).toEqual(
        expect.objectContaining({
          player: bot._id,
          ready: true,
          isBot: true,
          saidUno: false,
        }),
      );
    });

    it("creates a linked ScorePlayer for the added bot", async () => {
      const bot = setupBotCreation();
      const game = buildGame({ players: [] });
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);

      await orchestrator.addBotToGame("game1");

      expect(orchestrator.createScorePlayerFor).toHaveBeenCalledWith(
        bot._id,
        "game1",
        "fake-session",
      );
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.gameRepository.getById.mockResolvedValue(null);

      await expect(orchestrator.addBotToGame("game1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws BusinessError when the game is not in PENDING status", async () => {
      const game = buildGame({ status: GAME_STATUS.ACTIVE });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.addBotToGame("game1")).rejects.toThrow(
        BusinessError,
      );
    });

    it("throws BusinessError when the game is already full", async () => {
      const game = buildGame({
        players: [{}, {}, {}, {}],
        maxPlayers: 4,
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.addBotToGame("game1")).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("draw", () => {
    const setupActiveGame = (over = {}) =>
      buildGame({
        status: GAME_STATUS.ACTIVE,
        currentPlayer: { toString: () => "player1" },
        players: [
          { player: { toString: () => "player1" } },
          { player: { toString: () => "player2" } },
        ],
        ...over,
      });

    it("draws a card for the current player and passes the turn to the next player", async () => {
      const game = setupActiveGame();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);

      const engineState = {
        players: [{ player: "player1" }, { player: "player2" }],
      };
      orchestrator.gameStateMapper.toEngineState.mockResolvedValue(engineState);
      GameEngine.drawFromDeck.mockReturnValue({
        state: { ...engineState, deck: [] },
        drawn: [{ id: "c1" }],
      });

      orchestrator.runBotTurnIfNeeded = jest.fn().mockResolvedValue(game);

      await orchestrator.draw("player1", "game1");

      expect(GameEngine.drawFromDeck).toHaveBeenCalled();
      expect(
        orchestrator.gameStateMapper.applyEngineStateToGame,
      ).toHaveBeenCalled();
      expect(orchestrator.runBotTurnIfNeeded).toHaveBeenCalledWith("game1");
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.gameRepository.getById.mockResolvedValue(null);

      await expect(orchestrator.draw("player1", "game1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws BusinessError when the game is not active", async () => {
      const game = setupActiveGame({ status: GAME_STATUS.PENDING });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.draw("player1", "game1")).rejects.toThrow(
        BusinessError,
      );
    });

    it("throws BusinessError when the player is not present in the game", async () => {
      const game = setupActiveGame({
        players: [{ player: { toString: () => "someoneElse" } }],
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.draw("player1", "game1")).rejects.toThrow(
        BusinessError,
      );
    });

    it("throws BusinessError when it is not the player's turn", async () => {
      const game = setupActiveGame({
        currentPlayer: { toString: () => "player2" },
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.draw("player1", "game1")).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("play", () => {
    const setupActiveGame = (over = {}) =>
      buildGame({
        status: GAME_STATUS.ACTIVE,
        currentPlayer: { toString: () => "player1" },
        players: [
          { player: { toString: () => "player1" } },
          { player: { toString: () => "player2" } },
        ],
        ...over,
      });

    const setupEngineState = (over = {}) => ({
      players: [
        { hand: { cards: [{ id: "card1" }] } },
        { hand: { cards: [] } },
      ],
      discard: [],
      activeColor: "red",
      ...over,
    });

    it("plays a valid card and updates the game state", async () => {
      const game = setupActiveGame();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);
      orchestrator.gameStateMapper.toEngineState.mockResolvedValue(
        setupEngineState(),
      );
      GameEngine.validatePlay.mockReturnValue(true);
      GameEngine.applyPlay.mockReturnValue({
        state: { currentPlayer: "player2" },
        drawnCards: [],
        effect: "none",
      });
      orchestrator.runBotTurnIfNeeded = jest.fn().mockResolvedValue(game);

      await orchestrator.play("player1", "game1", "card1");

      expect(GameEngine.applyPlay).toHaveBeenCalled();
      expect(orchestrator.runBotTurnIfNeeded).toHaveBeenCalledWith("game1");
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.gameRepository.getById.mockResolvedValue(null);

      await expect(
        orchestrator.play("player1", "game1", "card1"),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws BusinessError when the game is not active", async () => {
      const game = setupActiveGame({ status: GAME_STATUS.FINISHED });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(
        orchestrator.play("player1", "game1", "card1"),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when the player is not present in the game", async () => {
      const game = setupActiveGame({
        players: [{ player: { toString: () => "someoneElse" } }],
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(
        orchestrator.play("player1", "game1", "card1"),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when it is not the player's turn", async () => {
      const game = setupActiveGame({
        currentPlayer: { toString: () => "player2" },
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(
        orchestrator.play("player1", "game1", "card1"),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when the card is not found in the player's hand", async () => {
      const game = setupActiveGame();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameStateMapper.toEngineState.mockResolvedValue(
        setupEngineState({
          players: [{ hand: { cards: [] } }, { hand: { cards: [] } }],
        }),
      );

      await expect(
        orchestrator.play("player1", "game1", "card-not-exists"),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when the play is invalid according to the engine", async () => {
      const game = setupActiveGame();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameStateMapper.toEngineState.mockResolvedValue(
        setupEngineState(),
      );
      GameEngine.validatePlay.mockReturnValue(false);

      await expect(
        orchestrator.play("player1", "game1", "card1"),
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("start", () => {
    const setupPendingGame = (over = {}) =>
      buildGame({
        status: GAME_STATUS.PENDING,
        owner: { toString: () => "owner1" },
        players: [
          { player: "p1", ready: true },
          { player: "p2", ready: true },
        ],
        ...over,
      });

    beforeEach(() => {
      createDeck.mockReturnValue([{ color: "red", type: "number", value: 5 }]);
      orchestrator.cardRepository.createMany.mockResolvedValue([
        { _id: "cardDbId1" },
      ]);
      GameEngine.startGameState.mockReturnValue({
        currentPlayer: "p1",
        players: [],
      });
    });

    it("starts the game, persists cards and initial engine state", async () => {
      const game = setupPendingGame();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);
      orchestrator.runBotTurnIfNeeded = jest.fn().mockResolvedValue(game);

      await orchestrator.start("owner1", "game1");

      expect(orchestrator.cardRepository.createMany).toHaveBeenCalled();
      expect(GameEngine.startGameState).toHaveBeenCalled();
      expect(
        orchestrator.gameStateMapper.applyEngineStateToGame,
      ).toHaveBeenCalled();
    });

    it("sets game status to ACTIVE and triggers bot turn resolution", async () => {
      const game = setupPendingGame();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);
      orchestrator.runBotTurnIfNeeded = jest.fn().mockResolvedValue(game);

      await orchestrator.start("owner1", "game1");

      expect(game.status).toBe(GAME_STATUS.ACTIVE);
      expect(orchestrator.runBotTurnIfNeeded).toHaveBeenCalledWith("game1");
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.gameRepository.getById.mockResolvedValue(null);

      await expect(orchestrator.start("owner1", "game1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws BusinessError when the requester is not the game owner", async () => {
      const game = setupPendingGame({
        owner: { toString: () => "someoneElse" },
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.start("owner1", "game1")).rejects.toThrow(
        BusinessError,
      );
    });

    it("throws BusinessError when the game is not in PENDING status", async () => {
      const game = setupPendingGame({ status: GAME_STATUS.ACTIVE });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.start("owner1", "game1")).rejects.toThrow(
        BusinessError,
      );
    });

    it("throws BusinessError when there are fewer than 2 players", async () => {
      const game = setupPendingGame({
        players: [{ player: "p1", ready: true }],
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.start("owner1", "game1")).rejects.toThrow(
        BusinessError,
      );
    });

    it("throws BusinessError when not all players are ready", async () => {
      const game = setupPendingGame({
        players: [
          { player: "p1", ready: true },
          { player: "p2", ready: false },
        ],
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.start("owner1", "game1")).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("playBotTurn", () => {
    const buildActiveGameWithBot = (over = {}) =>
      buildGame({
        status: GAME_STATUS.ACTIVE,
        currentPlayer: { toString: () => "bot1" },
        players: [
          { player: { toString: () => "bot1" }, isBot: true, saidUno: false },
        ],
        ...over,
      });

    it("returns the game unchanged when the game is not active", async () => {
      const game = buildGame({ status: GAME_STATUS.PENDING });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      const result = await orchestrator.playBotTurn("game1");

      expect(result).toBe(game);
      expect(orchestrator.gameRepository.update).not.toHaveBeenCalled();
    });

    it("returns the game unchanged when the current player is not a bot", async () => {
      const game = buildActiveGameWithBot({
        players: [{ player: { toString: () => "bot1" }, isBot: false }],
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      const result = await orchestrator.playBotTurn("game1");

      expect(result).toBe(game);
      expect(orchestrator.gameRepository.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.gameRepository.getById.mockResolvedValue(null);

      await expect(orchestrator.playBotTurn("game1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws BusinessError when the current player is not present in the game", async () => {
      const game = buildGame({
        status: GAME_STATUS.ACTIVE,
        currentPlayer: { toString: () => "ghost" },
        players: [],
      });
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      await expect(orchestrator.playBotTurn("game1")).rejects.toThrow(
        BusinessError,
      );
    });

    it("makes the bot draw a card and pass the turn when no play is available", async () => {
      const game = buildActiveGameWithBot();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);

      const engineState = { players: [{ player: "bot1" }], discard: [] };
      orchestrator.gameStateMapper.toEngineState.mockResolvedValue(engineState);
      orchestrator.bot.choosePlay.mockReturnValue(null);
      GameEngine.drawFromDeck.mockReturnValue({
        state: { players: [{ player: "bot1" }] },
        drawn: [{ id: "c1" }],
      });

      await orchestrator.playBotTurn("game1");

      expect(GameEngine.drawFromDeck).toHaveBeenCalled();
      expect(GameEngine.applyPlay).not.toHaveBeenCalled();
    });

    it("makes the bot play a valid card chosen by the bot strategy", async () => {
      const game = buildActiveGameWithBot();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);

      const engineState = {
        players: [{ player: "bot1" }],
        discard: [],
        activeColor: "red",
      };
      orchestrator.gameStateMapper.toEngineState.mockResolvedValue(engineState);
      const decision = { card: { id: "c1" }, colorChoice: null };
      orchestrator.bot.choosePlay.mockReturnValue(decision);
      GameEngine.validatePlay.mockReturnValue(true);
      GameEngine.applyPlay.mockReturnValue({
        state: { players: [{ hand: { cards: [] } }] },
        drawnCards: [],
        effect: "none",
      });

      await orchestrator.playBotTurn("game1");

      expect(GameEngine.applyPlay).toHaveBeenCalledWith(
        engineState,
        0,
        decision.card,
        decision.colorChoice,
      );
    });

    it("throws BusinessError when the bot's chosen play is invalid", async () => {
      const game = buildActiveGameWithBot();
      orchestrator.gameRepository.getById.mockResolvedValue(game);

      const engineState = { players: [{ player: "bot1" }], discard: [] };
      orchestrator.gameStateMapper.toEngineState.mockResolvedValue(engineState);
      orchestrator.bot.choosePlay.mockReturnValue({
        card: { id: "c1" },
        colorChoice: null,
      });
      GameEngine.validatePlay.mockReturnValue(false);

      await expect(orchestrator.playBotTurn("game1")).rejects.toThrow(
        BusinessError,
      );
    });

    it("sets saidUno to true when the bot ends its turn with exactly one card", async () => {
      const game = buildActiveGameWithBot();
      orchestrator.gameRepository.getById.mockResolvedValue(game);
      orchestrator.gameRepository.update.mockResolvedValue(game);

      const engineState = { players: [{ player: "bot1" }], discard: [] };
      orchestrator.gameStateMapper.toEngineState.mockResolvedValue(engineState);
      orchestrator.bot.choosePlay.mockReturnValue({
        card: { id: "c1" },
        colorChoice: null,
      });
      GameEngine.validatePlay.mockReturnValue(true);
      GameEngine.applyPlay.mockReturnValue({
        state: {
          players: [{ hand: { cards: [{ id: "onlyCard" }] } }],
        },
        drawnCards: [],
        effect: "none",
      });

      await orchestrator.playBotTurn("game1");

      expect(game.players[0].saidUno).toBe(true);
    });
  });

  describe("getNextPlayerIndex", () => {
    it("returns the next index moving forward when direction is 1", () => {
      const state = { players: [1, 2, 3], direction: 1 };
      expect(orchestrator.getNextPlayerIndex(state, 0)).toBe(1);
    });

    it("returns the next index moving backward (wrapping) when direction is -1", () => {
      const state = { players: [1, 2, 3], direction: -1 };
      expect(orchestrator.getNextPlayerIndex(state, 0)).toBe(2);
    });
  });

  describe("runBotTurnIfNeeded", () => {
    it("resolves consecutive bot turns until a human player's turn or the game is no longer active", async () => {
      const humanGame = buildGame({
        status: GAME_STATUS.ACTIVE,
        currentPlayer: { toString: () => "human1" },
        players: [{ player: { toString: () => "human1" }, isBot: false }],
      });
      const botGame = buildGame({
        status: GAME_STATUS.ACTIVE,
        currentPlayer: { toString: () => "bot1" },
        players: [{ player: { toString: () => "bot1" }, isBot: true }],
      });

      orchestrator.gameRepository.getById.mockResolvedValue(botGame);
      orchestrator.playBotTurn = jest.fn().mockResolvedValue(humanGame);

      const result = await orchestrator.runBotTurnIfNeeded("game1");

      expect(orchestrator.playBotTurn).toHaveBeenCalledTimes(1);
      expect(result).toBe(humanGame);
    });

    it("throws NotFoundError when the game does not exist", async () => {
      orchestrator.gameRepository.getById.mockResolvedValue(null);

      await expect(orchestrator.runBotTurnIfNeeded("game1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("stops after reaching the maximum allowed consecutive bot turns and logs a warning", async () => {
      const botGame = buildGame({
        status: GAME_STATUS.ACTIVE,
        currentPlayer: { toString: () => "bot1" },
        players: [{ player: { toString: () => "bot1" }, isBot: true }],
      });

      orchestrator.gameRepository.getById.mockResolvedValue(botGame);
      orchestrator.playBotTurn = jest.fn().mockResolvedValue(botGame);

      const result = await orchestrator.runBotTurnIfNeeded("game1");

      expect(orchestrator.playBotTurn).toHaveBeenCalledTimes(20);
      expect(orchestrator.log.warn).toHaveBeenCalled();
      expect(result).toBe(botGame);
    });
  });
});
