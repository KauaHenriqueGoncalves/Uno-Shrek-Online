import GameRepository from "./game.repository.js";
import GameEngine from "./game.engine.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { BusinessError } from "../shared/errors/business.error.js";
import { NotFoundError } from "../shared/errors/not-found.error.js";
import { GAME_STATUS } from "./game.schema.js";
import ScorePlayerRepository from "../score/score-player.repository.js";
import PlayerRepository from "../player/player.repository.js";
import CardRepository from "../card/card.repository.js";
import { createDeck } from "./util/deck.js";
import TransactionRunner from "../shared/mongoose/transaction-runner.js";
import GameStateMapper from "./mapper/game-state.mapper.js";
import UnoBot from "./bot/uno.bot.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export default class GameOrchestrator {
  constructor(gameSchema, scoreSchema, playerSchema, cardSchema) {
    this.gameRepository = new GameRepository(gameSchema);
    this.scoreRepository = new ScorePlayerRepository(scoreSchema);
    this.playerRepository = new PlayerRepository(playerSchema);
    this.cardRepository = new CardRepository(cardSchema);
    this.gameStateMapper = new GameStateMapper(cardSchema);
    this.transaction = new TransactionRunner();
    this.log = PinoGlobal.getInstance();
    this.bot = new UnoBot();
  }

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

  async draw(userId, gameId) {

     await this.transaction.run(async (session) => {

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

      if (game.currentPlayer && game.currentPlayer.toString() !== userId.toString()) {
        this.log.warn(
          `Not player's turn to draw. [playerId=${userId}] [gameId=${gameId}] [currentPlayer=${game.currentPlayer}]`,
        );
        throw new BusinessError("It's not your turn");
      }

      // Buying a card from the deck
      const state = await this.gameStateMapper.toEngineState(game);

      const { state: stateAfterDraw, drawn } = GameEngine.drawFromDeck(
        state,
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

      // Comprar carta consome o turno: passa a vez pro próximo jogador.
      const nextIndex = (playerIndex + 1) % stateAfterDraw.players.length;

      stateAfterDraw.currentPlayer = stateAfterDraw.players[nextIndex].player;

      this.log.info(
        `Turn passed after draw. [gameId=${gameId}] [from=${userId}] [to=${stateAfterDraw.currentPlayer}]`,
      );

      this.gameStateMapper.applyEngineStateToGame(game, stateAfterDraw);

      const updatedGame = await this.gameRepository.update(
        gameId,
        game,
        session,
      );

      this.log.info(`Draw completed. [playerId=${userId}] [gameId=${gameId}]`);
      
    });

    return await this.runBotTurnIfNeeded(
        gameId,
      );
  }

  async play(userId, gameId, cardId, colorChoice = null) {
    
    
    const updatedGame = await this.transaction.run(
      async (session) => {
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
      const updatedGame = await this.gameRepository.update(
        gameId,
        game,
        session,
      );
      this.log.info(`Play completed. [playerId=${userId}] [gameId=${gameId}]`);
      return updatedGame;
    });

    // Deixa o bot jogar
    return await this.runBotTurnIfNeeded(
    gameId,
  );
  }

  async start(ownerId, gameId) {
      
    await this.transaction.run(async (session) => {
      const game = await this.gameRepository.getById(
        gameId,
        session,
      );

      this.log.info(
        `owner want to start the game. [ownerId=${ownerId}] [gameId=${gameId}]`,
      );
      if (!game) {
        this.log.warn(
          `To start game just owner. [ownerId=${ownerId}] [gameId=${gameId}]`,
        );
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
      const cardsToPersist = rawDeck.map((c) => {
        return {
          gameId: game._id,
          color: c.color,
          type: c.type,
          value:
            c.value === null || c.value === undefined ? null : String(c.value),
        };
      });
      const persistedCards = await this.cardRepository.createMany(
        cardsToPersist,
        session,
      );
      this.log.info(
        { gameId, cardsCreated: persistedCards.length },
        "Cards persisted for game",
      );

      // Anexa o id real do Mongo a cada carta, preservando a ordem embaralhada.
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
      const updatedGame = await this.gameRepository.update(
        gameId,
        game,
        session,
      );
      this.log.info(`Game started. [ownerId=${ownerId}] [gameId=${gameId}]`);
      return updatedGame;
    });
    // Aqui deixa o bot jogar
    return await this.runBotTurnIfNeeded(
      gameId,
    );
  }

  async playBotTurn(gameId) {
  return await this.transaction.run(async (session) => {
    const game = await this.gameRepository.getById(
      gameId,
      session,
    );

    if (!game) {
      throw new NotFoundError("Game not found");
    }

    if (game.status !== GAME_STATUS.ACTIVE) {
      return game;
    }

    const currentPlayerId =
      game.currentPlayer?.toString();

    const playerIndex = game.players.findIndex(
      (player) =>
        player.player.toString() ===
        currentPlayerId,
    );

    if (playerIndex === -1) {
      throw new BusinessError(
        "Current player is not present in game",
      );
    }

    const player = game.players[playerIndex];

    // Este método só deve ser chamado quando o jogador atual for um bot.
    if (player.isBot !== true) {
      return game;
    }

    const state =
      await this.gameStateMapper.toEngineState(
        game,
      );

    const decision =
      this.bot.choosePlay(
        state,
        playerIndex,
      );

    // Nenhuma carta jogável, o bot deve comprar uma carta
    if (!decision) {
      const {
        state: stateAfterDraw,
        drawn,
      } = GameEngine.drawFromDeck(
        state,
        playerIndex,
        1,
      );

      const nextIndex =
        this.getNextPlayerIndex(
          stateAfterDraw,
          playerIndex,
        );

      stateAfterDraw.currentPlayer =
        stateAfterDraw.players[
          nextIndex
        ].player;

      this.gameStateMapper
        .applyEngineStateToGame(
          game,
          stateAfterDraw,
        );

      const updatedGame =
        await this.gameRepository.update(
          gameId,
          game,
          session,
        );

      this.log.info(
        {
          gameId,
          playerId: currentPlayerId,
          drawnCards: drawn.length,
          nextPlayer:
            stateAfterDraw.currentPlayer,
        },
        "Bot drew a card",
      );

      return updatedGame;
    }

    // Verifica denovo se a carta escolhida pode real ser usada.
    const topCard =
      state.discard.length > 0
        ? state.discard[
            state.discard.length - 1
          ]
        : null;

    if (
      !GameEngine.validatePlay(
        decision.card,
        topCard,
        state.activeColor,
      )
    ) {
      throw new BusinessError(
        "Bot selected an invalid play",
      );
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

    // URROOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO automatico
    const remainingCards =
      stateAfterPlay.players[
        playerIndex
      ].hand.cards.length;

    game.players[playerIndex].saidUno =
      remainingCards === 1;

    if (remainingCards === 1) {
      this.log.info(
        {
          gameId,
          playerId: currentPlayerId,
        },
        "BOT DECLARED URROOOOOOOOOO",
      );
    }

    // Att o estado do jogo com o estado do engine, que já contém a carta jogada e o efeito aplicado
    this.gameStateMapper
      .applyEngineStateToGame(
        game,
        stateAfterPlay,
      );

    // Atualiza o campo saidUno do jogador bot
    game.players[playerIndex].saidUno =
      remainingCards === 1;

    const updatedGame =
      await this.gameRepository.update(
        gameId,
        game,
        session,
      );

    this.log.info(
      {
        gameId,
        playerId: currentPlayerId,
        card: decision.card,
        colorChoice:
          decision.colorChoice,
        effect,
        drawnCards:
          drawnCards.length,
        remainingCards,
      },
      "Bot played a card",
    );

      return updatedGame;
    });
  }
  getNextPlayerIndex(state, playerIndex) {
    const direction =
      state.direction === -1
        ? -1
        : 1;

    return (
      (playerIndex + direction + state.players.length) %
      state.players.length
      );
    }

    async runBotTurnIfNeeded(gameId) {
      let game = await this.gameRepository.getById(
      gameId,
    );

    if (!game) {
      throw new NotFoundError("Game not found");
    }

  
    // Limita para impedir um loop infinito. (FASE DE TESTE)
    let botTurns = 0;
    const MAX_BOT_TURNS = 20;

    while (
      game.status === GAME_STATUS.ACTIVE &&
      botTurns < MAX_BOT_TURNS
    ) {
      const currentPlayerId =
        game.currentPlayer?.toString();

      const currentPlayer =
        game.players.find(
          (player) =>
            player.player.toString() ===
            currentPlayerId,
        );

      if (!currentPlayer?.isBot) {
        break;
      }

      this.log.info(
        {
          gameId,
          playerId: currentPlayerId,
          turn: botTurns + 1,
        },
        "Starting bot turn",
      );

      game = await this.playBotTurn(
        gameId,
      );

      botTurns++;
    }

    if (botTurns >= MAX_BOT_TURNS) {
      this.log.warn(
        {
          gameId,
          botTurns,
        },
        "Maximum consecutive bot turns reached",
      );
    }

    return game;
  }
}
