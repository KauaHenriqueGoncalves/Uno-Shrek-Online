import { EventEmitter } from "events";
import GameRepository from "./game.repository.js";
import GameEngine from "./game.engine.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { BusinessError } from "../shared/errors/business.error.js";
import { NotFoundError } from "../shared/errors/not-found.error.js";
import { GAME_STATUS } from "./game.schema.js";
import ScorePlayerRepository from "../score/score-player.repository.js";
import PlayerRepository from "../player/player.repository.js";
import CardRepository from "../card/card.repository.js";
import HistoryRepository from "../history/history.repository.js";
import { createDeck } from "./util/deck.js";
import TransactionRunner from "../shared/mongoose/transaction-runner.js";
import GameStateMapper from "./mapper/game-state.mapper.js";
import UnoBot from "./bot/uno.bot.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export default class GameOrchestrator extends EventEmitter {
  constructor(
    gameSchema,
    scoreSchema,
    playerSchema,
    cardSchema,
    historySchema,
    botThinkingDelayMs = 2500,
  ) {
    super();
    this.gameRepository = new GameRepository(gameSchema);
    this.scoreRepository = new ScorePlayerRepository(scoreSchema);
    this.playerRepository = new PlayerRepository(playerSchema);
    this.cardRepository = new CardRepository(cardSchema);
    this.historyRepository = new HistoryRepository(historySchema);
    this.gameStateMapper = new GameStateMapper(cardSchema);
    this.transaction = new TransactionRunner();
    this.log = PinoGlobal.getInstance();
    this.bot = new UnoBot();
    this.botThinkingDelayMs = botThinkingDelayMs;
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  //---------------------------------------------------------
  //-----------------------HELPERS---------------------------Lembrar de usar eles depois aq dentro
  //---------------------------------------------------------

  _sameId(first, second) {
    return String(first) === String(second);
  }

  _findPlayerIndex(game, playerId) {
    return game.players.findIndex((player) =>
      this._sameId(player.player, playerId),
    );
  }

  _getPlayerIndexOrThrow(game, playerId) {
    const playerIndex = this._findPlayerIndex(game, playerId);

    if (playerIndex === -1) {
      this.log.warn(
        `Player is not present in game. [playerId=${playerId}] [gameId=${game._id}]`,
      );

    throw new BusinessError("Player is not present this game");
    }

    return playerIndex;
  }

  _ensureGameStatus(game, expectedStatus, message) {
    if (game.status !== expectedStatus) {
      this.log.warn(
        `Invalid game status. [gameId=${game._id}] [status=${game.status}]`,
      );

      throw new BusinessError(message);
    }
  }

  _ensurePlayerTurn(game, playerId) {
    if (
      game.currentPlayer &&
      !this._sameId(game.currentPlayer, playerId)
    ) {
        this.log.warn(
        `Not player's turn. [playerId=${playerId}] [gameId=${game._id}] [currentPlayer=${game.currentPlayer}]`,
      );

      throw new BusinessError("It's not your turn");
    }
  }

  async _getGameOrThrow(gameId, session = null) {
    const game = await this.gameRepository.getById(gameId, session);

    if (!game) {
      this.log.warn(`Game not found. [gameId=${gameId}]`);
      throw new NotFoundError("Game not found");
    }

    return game;
  }

  async _getActiveGameAndPlayer(gameId, playerId, session = null) {
    const game = await this._getGameOrThrow(gameId, session);

    this._ensureGameStatus(
      game,
      GAME_STATUS.ACTIVE,
      "Game is not active",
    );

    const playerIndex = this._getPlayerIndexOrThrow(
      game,
      playerId,
    );

    return {
      game,
      playerIndex,
    };
  }

  _saveEngineState(gameId, game, state, session = null) {
    this.gameStateMapper.applyEngineStateToGame(game, state);

    return this.gameRepository.update(
      gameId,
      game,
      session,
    );
  }

  _runBotTurnInBackground(gameId) {
    this.runBotTurnIfNeeded(gameId).catch((err) => {
      this.log.warn(
        { err, gameId },
        "Bot turn processing failed",
      );
    });
  }

  async _registerHistory(game, playerId, action, cardId = null, session = null) {
    const history = await this.historyRepository.create(
      { player: playerId, action, card: cardId },
      session,
    );
    game.histories.push(history._id);
    return history;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////

  async getFullGame(gameId, session = null) {
    this.log.info(`Fetching full game. [gameId=${gameId}]`);
    const game = await this.gameRepository.getByIdPopulated(gameId, session);
    if (!game) {
      this.log.warn(`Game not found. [gameId=${gameId}]`);
      throw new NotFoundError("Game not found");
    }
    return game;
  }

  async createScorePlayerFor(playerId, gameId, session = null) {
    const scorePlayer = await this.scoreRepository.create(
      { playerId, gameId, score: 0 },
      session,
    );
    this.log.info(
      `ScorePlayer created for game. [gameId=${gameId}] [playerId=${playerId}]`,
    );
    const game = await this.gameRepository.getById(gameId, session);
    if (!game) {
      this.log.warn(
        `Game not found for creating score player. [gameId=${gameId}] [playerId=${playerId}]`,
      );
      throw new NotFoundError("Game not found");
    }
    const entry = game.players.find(
      (p) => p.player.toString() === playerId.toString(),
    );
    if (!entry) {
      this.log.warn(
        `Player not found in game for creating score player. [gameId=${gameId}] [playerId=${playerId}]`,
      );
      throw new BusinessError("Player is not present this game");
    }
    entry.scorePlayer = scorePlayer._id;
    const updatedGame = await this.gameRepository.update(gameId, game, session);
    return { game: updatedGame, scorePlayer };
  }

  async updateScore(playerId, gameId, score, session = null) {
    this.log.info(
      `Updating score for player in game. [gameId=${gameId}] [playerId=${playerId}] [score=${score}]`,
    );
    const game = await this.gameRepository.getById(gameId, session);
    if (!game) {
      this.log.warn(
        `Game not found for updating score. [gameId=${gameId}] [playerId=${playerId}]`,
      );
      throw new NotFoundError("Game not found");
    }
    const entry = game.players.find(
      (p) => p.player.toString() === playerId.toString(),
    );
    if (!entry) {
      this.log.warn(
        `Player not found in game for updating score. [gameId=${gameId}] [playerId=${playerId}]`,
      );
      throw new BusinessError("Player is not present this game");
    }
    if (!entry.scorePlayer) {
      this.log.warn(
        `Player has no scorePlayer bound to this game. [gameId=${gameId}] [playerId=${playerId}]`,
      );
      throw new BusinessError("Player has no scorePlayer bound to this game");
    }
    if (typeof score !== "number" || score < 0) {
      this.log.warn(
        `Invalid score value. [gameId=${gameId}] [playerId=${playerId}] [score=${score}]`,
      );
      throw new BusinessError("Score must be a non-negative number");
    }
    const updatedScore = await this.scoreRepository.update(
      entry.scorePlayer.toString(),
      { score },
      session,
    );
    return updatedScore;
  }

  /**
   * Cria um Player de sistema para representar o bot na partida.
   * O bot precisa ser um documento Player real porque o schema do Game
   * referencia ObjectId de Player.
   *
   * @param {string} gameId - usado só para log
   * @param {object} [session] - sessão mongoose opcional
   * @returns {Promise<import("mongoose").Document>} O documento Player do bot criado
   */
  async createBotPlayer(gameId, session = null) {
    const username = `ShrekBot_${crypto.randomUUID().slice(0, 8)}`;
    const email = `${username}@urro.local`;
    const password = await bcrypt.hash(crypto.randomUUID(), 10);
    const botPlayer = await this.playerRepository.create(
      { username, age: 18, email, password },
      session,
    );
    this.log.info(
      { gameId, botId: botPlayer._id.toString(), username },
      "Bot player created",
    );
    return botPlayer;
  }

  /**
   * Adiciona um bot à partida pendente.
   * Cria um Player de sistema, insere na lista de jogadores com isBot=true e
   * já cria o ScorePlayer vinculado — tudo dentro de uma transação.
   *
   * @param {string} gameId
   * @returns {Promise<import("mongoose").Document>} O jogo atualizado
   */
  async addBotToGame(gameId) {
    return await this.transaction.run(async (session) => {
      const game = await this.gameRepository.getById(gameId, session);
      if (!game) {
        this.log.warn(`Game not found for addBot. [gameId=${gameId}]`);
        throw new NotFoundError("Game not found");
      }
      if (game.status !== GAME_STATUS.PENDING) {
        this.log.warn(
          `Cannot add bot to non-pending game. [gameId=${gameId}] [status=${game.status}]`,
        );
        throw new BusinessError("Cannot add bot to an active or finished game");
      }
      if (game.players.length >= game.maxPlayers) {
        this.log.warn(
          `Game is full, cannot add bot. [gameId=${gameId}] [players=${game.players.length}] [max=${game.maxPlayers}]`,
        );
        throw new BusinessError("Game is full");
      }
      const bot = await this.createBotPlayer(gameId, session);
      game.players.push({
        player: bot._id,
        ready: true,
        isBot: true,
        saidUno: false,
      });
      const updatedGame = await this.gameRepository.update(
        gameId,
        game,
        session,
      );
      await this.createScorePlayerFor(bot._id, gameId, session);
      this.log.info(
        { gameId, botId: bot._id.toString(), username: bot.username },
        "Bot added to game",
      );
      return updatedGame;
    });
  }

  async draw(userId, gameId) {
    const updatedGame = await this.transaction.run(async (session) => {
      this.log.info(
        `Player wants to draw a card. [playerId=${userId}] [gameId=${gameId}]`,
      );
      const game = await this.gameRepository.getById(gameId, session);
      if (!game) {
        this.log.warn(`Game not found for draw. [gameId=${gameId}]`);
        throw new NotFoundError("Game not found");
      }
      if (game.status !== GAME_STATUS.ACTIVE) {
        this.log.warn(
          `Cannot draw, game is not active. [gameId=${gameId}] [status=${game.status}]`,
        );
        throw new BusinessError("Cannot draw from a non-active game");
      }
      const playerIndex = game.players.findIndex(
        (p) => p.player.toString() === userId.toString(),
      );
      if (playerIndex === -1) {
        this.log.warn(
          `Player is not present in game. [playerId=${userId}] [gameId=${gameId}]`,
        );
        throw new BusinessError("Player is not present this game");
      }
      if (
        game.currentPlayer &&
        game.currentPlayer.toString() !== userId.toString()
      ) {
        this.log.warn(
          `Not player's turn to draw. [playerId=${userId}] [gameId=${gameId}] [currentPlayer=${game.currentPlayer}]`,
        );
        throw new BusinessError("It's not your turn");
      }
      const state = await this.gameStateMapper.toEngineState(game);
      const stateWithoutChallenge = GameEngine.clearUnoChallenge(state);

      const { state: stateAfterDraw, drawn } = GameEngine.drawFromDeck(
        stateWithoutChallenge,
        playerIndex,
        1,
      );
      this.log.debug(
        {
          gameId,
          playerId: userId,
          drawnCount: drawn.length,
          deckRemaining: stateAfterDraw.deck.length,
        },
        "Card drawn from deck",
      );
      const nextIndex = (playerIndex + 1) % stateAfterDraw.players.length;
      stateAfterDraw.currentPlayer = stateAfterDraw.players[nextIndex].player;
      this.log.info(
        `Turn passed after draw. [gameId=${gameId}] [from=${userId}] [to=${stateAfterDraw.currentPlayer}]`,
      );
      this.gameStateMapper.applyEngineStateToGame(game, stateAfterDraw);
      await this._registerHistory(
        game,
        userId,
        "draw",
        drawn[0]?.id ?? null,
        session,
      );
      const updated = await this.gameRepository.update(gameId, game, session);
      this.log.info(`Draw completed. [playerId=${userId}] [gameId=${gameId}]`);
      return updated;
    });

    this.runBotTurnIfNeeded(gameId).catch((err) => {
      this.log.warn({ err, gameId }, "Bot turn processing failed");
    });
    return updatedGame;
  }

  async play(userId, gameId, cardId, colorChoice = null) {
    const updatedGame = await this.transaction.run(async (session) => {
      this.log.info(
        `Player wants to play a card. [playerId=${userId}] [gameId=${gameId}] [cardId=${cardId}]`,
      );
      const game = await this.gameRepository.getById(gameId, session);
      if (!game) {
        this.log.warn(`Game not found for play. [gameId=${gameId}]`);
        throw new NotFoundError("Game not found");
      }
      if (game.status !== GAME_STATUS.ACTIVE) {
        this.log.warn(
          `Cannot play, game is not active. [gameId=${gameId}] [status=${game.status}]`,
        );
        throw new BusinessError("Cannot play in a non-active game");
      }
      const playerIndex = game.players.findIndex(
        (p) => p.player.toString() === userId.toString(),
      );
      if (playerIndex === -1) {
        this.log.warn(
          `Player is not present in game. [playerId=${userId}] [gameId=${gameId}]`,
        );
        throw new BusinessError("Player is not present this game");
      }
      if (
        game.currentPlayer &&
        game.currentPlayer.toString() !== userId.toString()
      ) {
        this.log.warn(
          `Not player's turn to play. [playerId=${userId}] [gameId=${gameId}] [currentPlayer=${game.currentPlayer}]`,
        );
        throw new BusinessError("It's not your turn");
      }
      const state = await this.gameStateMapper.toEngineState(game);
      const playedCard = state.players[playerIndex].hand.cards.find(
        (c) => c.id === cardId,
      );
      if (!playedCard) {
        this.log.warn(
          `Card not found in player's hand. [playerId=${userId}] [gameId=${gameId}] [cardId=${cardId}]`,
        );
        throw new BusinessError("Card not found in your hand");
      }
      const topCard =
        state.discard.length > 0
          ? state.discard[state.discard.length - 1]
          : null;
      if (!GameEngine.validatePlay(playedCard, topCard, state.activeColor)) {
        this.log.warn(
          {
            gameId,
            playerId: userId,
            playedCard,
            topCard,
            activeColor: state.activeColor,
          },
          "Invalid play attempt",
        );
        throw new BusinessError("Invalid play");
      }
      const {
        state: stateAfterPlay,
        drawnCards,
        effect,
      } = GameEngine.applyPlay(state, playerIndex, playedCard, colorChoice);
      this.log.debug(
        {
          gameId,
          playerId: userId,
          effect,
          cardsDrawnByNextPlayer: drawnCards.length,
        },
        "Card effect resolved",
      );
      this.log.info(
        `Turn passed after play. [gameId=${gameId}] [from=${userId}] [to=${stateAfterPlay.currentPlayer}]`,
      );
      this.gameStateMapper.applyEngineStateToGame(game, stateAfterPlay);
      const winnerId = GameEngine.checkWinner(stateAfterPlay);
      if (winnerId) {
        this.log.info({ gameId, winnerId }, "Player won the game");
        game.status = GAME_STATUS.FINISHED;
        game.winner = winnerId;
      }
      await this._registerHistory(
        game, 
        userId, 
        "play", 
        playedCard.id, 
        session
      );
      const updated = await this.gameRepository.update(gameId, game, session);
      this.log.info(`Play completed. [playerId=${userId}] [gameId=${gameId}]`);
      return updated;
    });

    this.runBotTurnIfNeeded(gameId).catch((err) => {
      this.log.warn({ err, gameId }, "Bot turn processing failed");
    });
    return updatedGame;
  }

  async sayUno(userId, gameId) {
    const updatedGame = await this.transaction.run(async (session) => {
      const game = await this.gameRepository.getById(gameId, session);

      if (!game) {
        throw new NotFoundError("Game not found");
      }
      if (game.status !== GAME_STATUS.ACTIVE) {
        throw new BusinessError("Cannot say UNO in a non-active game");
      }

      const playerIndex = game.players.findIndex(
        (player) => player.player.toString() === userId.toString(),
      );
      if (playerIndex === -1) {
        throw new BusinessError("Player is not present this game");
      }

      const state = await this.gameStateMapper.toEngineState(game);
      const stateAfterUno = GameEngine.sayUno(state, playerIndex);
      this.gameStateMapper.applyEngineStateToGame(game, stateAfterUno);

      return await this.gameRepository.update(gameId, game, session);
    });

    this.runBotTurnIfNeeded(gameId).catch((err) => {
      this.log.warn({ err, gameId }, "Bot turn processing failed");
    });
    return updatedGame;
  }

  async challengeUno(userId, gameId) {
    const updatedGame = await this.transaction.run(async (session) => {
      const game = await this.gameRepository.getById(gameId, session);

      if (!game) {
        throw new NotFoundError("Game not found");
      }
      if (game.status !== GAME_STATUS.ACTIVE) {
        throw new BusinessError("Cannot challenge UNO in a non-active game");
      }

      const challengerIndex = game.players.findIndex(
        (player) => player.player.toString() === userId.toString(),
      );
      if (challengerIndex === -1) {
        throw new BusinessError("Player is not present this game");
      }

      const state = await this.gameStateMapper.toEngineState(game);
      const targetId = state.unoChallenge?.player;
      const targetIndex = state.players.findIndex(
        (player) => player.player.toString() === targetId?.toString(),
      );
      const { state: stateAfterChallenge } = GameEngine.challengeUno(
        state,
        challengerIndex,
      );

      this.gameStateMapper.applyEngineStateToGame(game, stateAfterChallenge);
      if (targetIndex !== -1) {
        game.players[targetIndex].saidUno = false;
      }

      return await this.gameRepository.update(gameId, game, session);
    });

    this.runBotTurnIfNeeded(gameId).catch((err) => {
      this.log.warn({ err, gameId }, "Bot turn processing failed");
    });
    return updatedGame;
  }

  async start(ownerId, gameId) {
    const updatedGame = await this.transaction.run(async (session) => {
      const game = await this.gameRepository.getById(gameId, session);
      this.log.info(
        `owner want to start the game. [ownerId=${ownerId}] [gameId=${gameId}]`,
      );
      if (!game) {
        throw new NotFoundError("Game not found");
      }
      if (game.owner.toString() !== ownerId.toString()) {
        this.log.warn(
          `To start game just owner. [ownerId=${ownerId}] [gameId=${gameId}]`,
        );
        throw new BusinessError("Player is not owner to start game.");
      }
      if (game.status !== GAME_STATUS.PENDING) {
        this.log.warn(
          `Game cannot be started. [gameId=${gameId}] [status=${game.status}]`,
        );
        throw new BusinessError("Game already started or finished.");
      }
      if (game.players.length < 2) {
        this.log.warn(
          `Not enough players to start. [gameId=${gameId}] [players=${game.players.length}]`,
        );
        throw new BusinessError("Not enough players to start the game.");
      }
      if (!game.players.every((player) => player.ready === true)) {
        this.log.warn(
          `To start game all players must be ready. [ownerId=${ownerId}] [gameId=${gameId}]`,
        );
        throw new BusinessError("All players must be ready.");
      }
      this.log.debug(
        { gameId, players: game.players.length },
        "Validations passed, building initial engine state",
      );
      const HAND_SIZE = 7;
      const playerIds = game.players.map((p) => p.player);
      const rawDeck = createDeck();
      const cardsToPersist = rawDeck.map((c) => ({
        gameId: game._id,
        color: c.color,
        type: c.type,
        value:
          c.value === null || c.value === undefined ? null : String(c.value),
      }));
      const persistedCards = await this.cardRepository.createMany(
        cardsToPersist,
        session,
      );
      this.log.info(
        { gameId, cardsCreated: persistedCards.length },
        "Cards persisted for game",
      );
      const deckWithIds = rawDeck.map((c, index) => ({
        ...c,
        id: persistedCards[index]._id.toString(),
      }));
      const engineState = GameEngine.startGameState(
        playerIds,
        HAND_SIZE,
        deckWithIds,
      );
      this.gameStateMapper.applyEngineStateToGame(game, engineState);
      game.status = GAME_STATUS.ACTIVE;
      this.log.info(
        {
          ownerId,
          gameId,
          from: GAME_STATUS.PENDING,
          to: GAME_STATUS.ACTIVE,
          currentPlayer: game.currentPlayer?.toString(),
        },
        "Game status transition",
      );
      const updated = await this.gameRepository.update(gameId, game, session);
      this.log.info(`Game started. [ownerId=${ownerId}] [gameId=${gameId}]`);
      return updated;
    });

    this.runBotTurnIfNeeded(gameId).catch((err) => {
      this.log.warn({ err, gameId }, "Bot turn processing failed");
    });
    return updatedGame;
  }

  async playBotTurn(gameId) {
    return await this.transaction.run(async (session) => {
      const game = await this.gameRepository.getById(gameId, session);
      if (!game) {
        throw new NotFoundError("Game not found");
      }
      if (game.status !== GAME_STATUS.ACTIVE) {
        return game;
      }
      const currentPlayerId = game.currentPlayer?.toString();
      const playerIndex = game.players.findIndex(
        (player) => player.player.toString() === currentPlayerId,
      );
      if (playerIndex === -1) {
        throw new BusinessError("Current player is not present in game");
      }
      const player = game.players[playerIndex];
      if (player.isBot !== true) {
        return game;
      }
      const state = await this.gameStateMapper.toEngineState(game);
      const decision = this.bot.choosePlay(state, playerIndex);
      // Nenhuma carta jogável — bot compra uma carta
      if (!decision) {
        const { state: stateAfterDraw, drawn } = GameEngine.drawFromDeck(
          state,
          playerIndex,
          1,
        );
        const nextIndex = this.getNextPlayerIndex(stateAfterDraw, playerIndex);
        stateAfterDraw.currentPlayer = stateAfterDraw.players[nextIndex].player;
        this.gameStateMapper.applyEngineStateToGame(game, stateAfterDraw);
        const updatedGame = await this.gameRepository.update(
          gameId,
          game,
          session,
        );
        this.log.info(
          {
            gameId,
            playerId: currentPlayerId,
            drawnCards: drawn.length,
            nextPlayer: stateAfterDraw.currentPlayer,
          },
          "Bot drew a card",
        );
        return updatedGame;
      }
      const topCard =
        state.discard.length > 0
          ? state.discard[state.discard.length - 1]
          : null;
      if (!GameEngine.validatePlay(decision.card, topCard, state.activeColor)) {
        throw new BusinessError("Bot selected an invalid play");
      }
      const {
        state: stateAfterPlay,
        drawnCards,
        effect,
      } = GameEngine.applyPlay(
        state,
        playerIndex,
        decision.card,
        decision.colorChoice,
      );

      const remainingCards = stateAfterPlay.players[playerIndex].hand.cards.length;

      if (remainingCards === 1) {
        stateAfterPlay.unoChallenge = null;
        stateAfterPlay.players[playerIndex].saidUno = true;
      }

      this.gameStateMapper.applyEngineStateToGame(game, stateAfterPlay);

      const winnerId = GameEngine.checkWinner(stateAfterPlay);
      if (winnerId) {
          this.log.info(
          { gameId, winnerId: winnerId.toString() },
          "Bot won the game",
          );
          game.status = GAME_STATUS.FINISHED;
          game.winner = winnerId;
        }

      // Atualiza saidUno do bot
      game.players[playerIndex].saidUno = remainingCards === 1;
      if (remainingCards === 1) {
        this.log.info(
          { gameId, playerId: currentPlayerId },
          "BOT DECLARED URROOOOOOOOOO",
        );
      }
      const updatedGame = await this.gameRepository.update(
        gameId,
        game,
        session,
      );
      this.log.info(
        {
          gameId,
          playerId: currentPlayerId,
          card: decision.card,
          colorChoice: decision.colorChoice,
          effect,
          drawnCards: drawnCards.length,
          remainingCards,
        },
        "Bot played a card",
      );
      return updatedGame;
    });
  }

  getNextPlayerIndex(state, playerIndex) {
    const direction = state.direction === -1 ? -1 : 1;
    return (
      (playerIndex + direction + state.players.length) % state.players.length
    );
  }

  async runBotTurnIfNeeded(gameId) {
    let game = await this.gameRepository.getById(gameId);
    if (!game) {
      throw new NotFoundError("Game not found");
    }
    let botTurns = 0;
    const MAX_BOT_TURNS = 20;
    while (game.status === GAME_STATUS.ACTIVE && botTurns < MAX_BOT_TURNS) {
      const currentPlayerId = game.currentPlayer?.toString();
      const currentPlayer = game.players.find(
        (player) => player.player.toString() === currentPlayerId,
      );
      if (!currentPlayer?.isBot) {
        break;
      }

      if (game.unoChallengePlayer) {
        break;
      }

      this.log.info(
        { gameId, playerId: currentPlayerId, turn: botTurns + 1 },
        "Starting bot turn",
      );
      await this.wait(this.botThinkingDelayMs);
      game = await this.playBotTurn(gameId);
      botTurns++;
      this.emit("botTurn", game);
    }
    if (botTurns >= MAX_BOT_TURNS) {
      this.log.warn(
        { gameId, botTurns },
        "Maximum consecutive bot turns reached",
      );
    }
    return game;
  }
}
