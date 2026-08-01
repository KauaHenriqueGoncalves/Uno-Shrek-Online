import GameRepository from "./../repository/GameRepository.js";
import PinoGlobal from "./../config/logger/PinoGlobal.js";
import { NotFoundError } from "../config/exceptions/NotFoundError.js";
import { BusinessError } from "../config/exceptions/BusinessError.js";
import { CreateGameRequestDto } from "../dtos/request/game/CreateGameRequestDto.js";
import { UpdateGameRequestDto } from "../dtos/request/game/UpdateGameRequestDto.js";
import { GAME_STATUS } from "../schema/Game.js";
import { createDeck, deal, shuffle } from "../game/deck.js";
import GameEngine from "../game/GameEngine.js";
import mongoose from "mongoose";
import GameOrchestrator from "./GameOrchestrator.js";
import { GameStatusDto } from "../dtos/request/game/GameStatusDto.js";
import { parseOrThrow } from "./../config/utils/validate.js";
// Jwt decoding is handled by auth middleware; controllers pass `req.user.id`.


/**
 * Service responsible for all game-related business logic,
 * including creation, player management, game flow and card mechanics.
 */
export default class GameService {
   /**
   * @param {import("mongoose").Model} schema - Mongoose model for Game.
   * @param {import("./PlayerService.js").default} playerService - Player service instance.
   */
  constructor(schema, playerService) {
    this.gameRepository = new GameRepository(schema);
    this.playerService = playerService;
    this.log = PinoGlobal.getInstance();
    this.orchestrator = new GameOrchestrator(schema);
  }

   /**
   * Returns all games in the database.
   *
   * @returns {Promise<import("mongoose").Document[]>} List of all games.
   */
  async getAll() {
    this.log.info("Getting all games");
    const games = await this.gameRepository.getAll();
    return games;
  }

   /**
   * Returns all games in the database with a specific status.
   *
   * @param {string} status - The status to filter games by.
   * @returns {Promise<import("mongoose").Document[]>} List of games with the specified status.
   */
  async getAllByStatus(status) {
    this.log.info(`Getting all games by status. [status=${status}]`);
    const validData = parseOrThrow(GameStatusDto, { status });
    const games = await this.gameRepository.getAllByStatus(validData.status);
    return games;
  }

  /**
   * Returns a single game by its ID.
   *
   * @param {string} id - The game's MongoDB ObjectId as string.
   * @returns {Promise<import("mongoose").Document>} The found game document.
   * @throws {NotFoundError} If no game is found with the given ID.
   */
  async getById(id) {
    this.log.info(`Getting game by id [id=${id}]`);
    const game = await this.gameRepository.getById(id);
    if (!game) {
      this.log.warn({ gameId: id }, "Game not found");
      throw new NotFoundError("Game not found");
    }
    return game;
  }

  /**
   * Returns a game with its associated player information.
   *
   * @param {string} id - The game's MongoDB ObjectId as string.
   * @returns {Promise<{game: import("mongoose").Document, players: import("mongoose").Document[]}>} The game and its players.
   */
  async getByIdInfo(id) {
    this.log.info(`Getting game info by id [id=${id}]`);
    const game = await this.getById(id);
    const ids = game.players.map((p) => p.player.toString());
    const players = await this.playerService.getAllByIds(ids);
    return { game, players };
  }

  /**
   * Returns the current score of a game by its ID.
   *
   * @param {string} id - The game's MongoDB ObjectId as string.
   * @returns {Promise<{game: import("mongoose").Document, scores: {playerId: string, username: string, score: number}[]}>} The game and its current scores.
   */
  async getCurrentScoreById(id) {
    this.log.info(`Getting current score by game id [id=${id}]`);
    const game = await this.getById(id);
    const ids = game.players.map((p) => p.player.toString());
    const players = await this.playerService.getAllByIds(ids);
    const scores = game.players.map((p) => {
      const player = players.find(
        (player) => player._id.toString() === p.player.toString(),
      );
      const username = player ? player.username : "Unknown";
      return {
        playerId: p.player.toString(),
        username: username,
        score: p.score,
      };
    });
    return { game, scores };
  }

  /**
   * Returns the current players of a game by its ID.
   *
   * @param {string} id - The game's MongoDB ObjectId as string.
   * @returns {Promise<{game: import("mongoose").Document, players: import("mongoose").Document[]}>} The game and its current players.
   */
  async getCurrentPlayersById(id) {
    this.log.info(`Getting current players by game id [id=${id}]`);
    const game = await this.getById(id);
    const ids = game.players.map((p) => p.player);
    const players = await this.playerService.getAllByIds(ids);
    return { game, players };
  }

  /**
   * Returns the current player of a game by its ID.
   *
   * @param {string} id - The game's MongoDB ObjectId as string.
   * @returns {Promise<{game: import("mongoose").Document, player: import("mongoose").Document}>} The game and its current player.
   */
  async getCurrentPlayerById(id) {
    this.log.info(`Getting current player by game id [id=${id}]`);
    const game = await this.getById(id);
    const playerId =
      game.currentPlayer ?? (game.players && game.players[0]?.player);
    if (!playerId) {
      this.log.warn(
        { gameId: id },
        "No players in game to determine current player",
      );
      throw new NotFoundError("No players in game");
    }
    const player = await this.playerService.getById(playerId.toString());
    return { game, player };
  }

  /**
   * Returns the top card of a game by its ID.
   *
   * @param {string} id - The game's MongoDB ObjectId as string.
   * @returns {Promise<{game: import("mongoose").Document, topCard: Object}>} The game and its top card.
   */
  async getTopCardById(id) {
    this.log.info(`Getting top card by game id [id=${id}]`);
    const game = await this.getById(id);
    const top =
      game.discard && game.discard.length > 0
        ? game.discard[game.discard.length - 1]
        : null;
    return { game, topCard: top };
  }

  /**
   * Creates a new game.
   *
   * @param {string} userId - The id of the user creating the game.
   * @param {Object} data - The game data to create.
   * @returns {Promise<import("mongoose").Document>} The created game document.
   */
  async create(userId, data) {
    const validData = parseOrThrow(CreateGameRequestDto, data);
    this.log.info(
      `Creating a game. [title=${validData.title}] [maxPlayers=${validData.maxPlayers}]`,
    );
    const ownerId = userId;
    this.log.info(`Owner of game. [ownerId=${ownerId}]`);
    const activeGame = await this.gameRepository.getActiveGameByOwner(ownerId);
    if (activeGame) {
      this.log.warn(
        `Owner already has an active game. [ownerId=${ownerId}] [gameId=${activeGame._id.toString()}]`,
      );
      throw new BusinessError(
        "You already have an active game. Finish it before creating a new one.",
      );
    }
    const dataSave = {
      ...validData,
      owner: ownerId,
      players: [{ player: ownerId, ready: false, score: 0 }],
    };
    const game = await this.gameRepository.create(dataSave);
    this.log.info({ gameId: game._id.toString() }, "Game created");
    return game;
  }

  /**
   * Adds a player to an existing game.
   *
   * @param {string} userId - The id of the player joining the game.
   * @param {string} gameId - The ID of the game to join.
   * @returns {Promise<import("mongoose").Document>} The updated game document.
   */
  async joinInGame(userId, gameId) {
    const playerId = userId;
    this.log.info(
      `Player want to join in game. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    const game = await this.getById(gameId);
    if (game.status !== GAME_STATUS.PENDING) {
      this.log.warn(
        `Game not joinable. [gameId=${gameId}] [status=${game.status}]`,
      );
      throw new BusinessError("Cannot join a game that already started");
    }
    if (game.players.length >= game.maxPlayers) {
      this.log.warn(
        `Game is full. [gameId=${gameId}] [maxPlayers=${game.maxPlayers}]`,
      );
      throw new BusinessError("Game is full");
    }
    if (game.players.some((p) => p.player.toString() === playerId)) {
      this.log.warn(
        `Player already in game. [playerId=${playerId}] [gameId=${gameId}]`,
      );
      throw new BusinessError("Player already joined this game");
    }
    game.players.push({ player: playerId, ready: false });
    const gameUpdate = await this.gameRepository.update(gameId, game);
    this.log.info(
      `Player added on game. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    return gameUpdate;
  }

  /**
   * Removes a player from an existing game.
   *
   * @param {string} userId - The id of the player leaving the game.
   * @param {string} gameId - The ID of the game to leave.
   * @returns {Promise<import("mongoose").Document>} The updated game document.
   */
  async leaveGame(userId, gameId) {
    const playerId = userId;
    this.log.info(
      `Player want to leave game. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    const game = await this.getById(gameId);
    const condicionPlayer = game.players.find(
      (p) => p.player.toString() === playerId,
    );
    if (!condicionPlayer) {
      this.log.warn(
        `Player is not present in game. [playerId=${playerId}] [gameId=${gameId}]`,
      );
      throw new BusinessError("Player is not present this game");
    }
    const isOwner = game.owner.toString() === playerId;
    const remainingPlayers = game.players.filter(
      (p) => p.player.toString() !== playerId,
    );
    if (isOwner) {
      if (remainingPlayers.length === 0) {
        this.log.info(
          `Owner left with no players remaining, finishing game. [gameId=${gameId}]`,
        );
        game.status = GAME_STATUS.FINISHED;
      } else {
        const nextOwner = remainingPlayers[0];
        this.log.info(
          `Owner left, transferring ownership. [gameId=${gameId}] [newOwnerId=${nextOwner.player.toString()}]`,
        );
        game.owner = nextOwner.player;
      }
    }
    game.players = remainingPlayers;
    const gameUpdate = await this.gameRepository.update(gameId, game);
    this.log.info(
      `Player left the game. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    return gameUpdate;
  }

  /**
   * Sets a player as ready in an existing game.
   *
   * @param {string} userId - The id of the player marking ready.
   * @param {string} gameId - The ID of the game.
   * @returns {Promise<import("mongoose").Document>} The updated game document.
   */
  async readyInGame(userId, gameId) {
    const playerId = userId;
    this.log.info(
      `Player want to be ready in game. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    const game = await this.getById(gameId);
    const condicionPlayer = game.players.find(
      (p) => p.player.toString() === playerId,
    );
    if (!condicionPlayer) {
      this.log.warn(
        `Player is not present in game. [playerId=${playerId}] [gameId=${gameId}]`,
      );
      throw new BusinessError("Player is not present this game");
    }
    condicionPlayer.ready = true;
    const gameUpdate = await this.gameRepository.update(gameId, game);
    this.log.info(`Player is ready. [playerId=${playerId}] [gameId=${gameId}]`);
    return gameUpdate;
  }

  /**
   * Sets a player as not ready in an existing game.
   *
   * @param {string} userId - The id of the player marking not-ready.
   * @param {string} gameId - The ID of the game.
   * @returns {Promise<import("mongoose").Document>} The updated game document.
   */
  async notReadyInGame(userId, gameId) {
    const playerId = userId;
    this.log.info(
      `Player want to be not ready in game. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    const game = await this.getById(gameId);
    const condicionPlayer = game.players.find(
      (p) => p.player.toString() === playerId,
    );
    if (!condicionPlayer) {
      this.log.warn(
        `Player is not present in game. [playerId=${playerId}] [gameId=${gameId}]`,
      );
      throw new BusinessError("Player is not present this game");
    }
    condicionPlayer.ready = false;
    const gameUpdate = await this.gameRepository.update(gameId, game);
    this.log.info(`Player is not ready. [playerId=${playerId}] [gameId=${gameId}]`);
    return gameUpdate;
  }

  /**
   * Starts an existing game.
   *
   * @param {string} userId - The id of the user starting the game (owner).
   * @param {string} gameId - The ID of the game to start.
   * @returns {Promise<import("mongoose").Document>} The updated game document.
   */
  async startGame(userId, gameId) {
    this.log.info(`Delegating start to orchestrator. [ownerId=${userId}] [gameId=${gameId}]`);
    const updated = await this.orchestrator.start(userId, gameId);
    return updated;
  }

   /**
   * Refills the deck from the discard pile if the deck is empty.
   * Keeps the top discard card in place and shuffles the rest back into the deck.
   *
   * @param {import("mongoose").Document} game - The game document to mutate in place.
   * @returns {Promise<void>}
   */
  async _refillDeckIfNeeded(game) {

    if (!game.deck || game.deck.length === 0) {
      // keep the top of discard
      const top = game.discard && game.discard.length > 0 ? game.discard[game.discard.length - 1] : null;
      const rest = game.discard && game.discard.length > 1 ? game.discard.slice(0, game.discard.length - 1) : [];
      const shuffled = shuffle(rest);

      game.deck = shuffled;
      game.discard = top ? [top] : [];
    }
  }

  /**
   * Draws a card from the deck for the authenticated player and advances the turn.
   * Refills the deck automatically if it is empty.
   *
   * @param {string} userId - The id of the requesting player.
   * @param {string} gameId - The target game's MongoDB ObjectId as string.
   * @returns {Promise<import("mongoose").Document>} The updated game after the draw.
   * @throws {BusinessError} If the game is not active, the player is not in the game,
   *   it is not the player's turn, or there are no cards left to draw.
   * @throws {NotFoundError} If no game is found.
   */
  async draw(userId, gameId) {
    this.log.info(`Delegating draw to orchestrator. [playerId=${userId}] [gameId=${gameId}]`);
    const updated = await this.orchestrator.draw(userId, gameId);
    return updated;
  }

  /**
   * Plays a card from the authenticated player's hand.
   *
   * @param {string} userId - The id of the requesting player.
   * @param {string} gameId - The target game's MongoDB ObjectId as string.
   * @param {Object} playedCard - The card to be played.
   * @param {string} [colorChoice] - The color chosen for a wild card, if applicable.
   * @returns {Promise<import("mongoose").Document>} The updated game document.
   * @throws {BusinessError} If the game is not active, the player is not in the game,
   *   it is not the player's turn, or the play is invalid.
   * @throws {NotFoundError} If no game is found.
   */
  async play(userId, gameId, playedCard, colorChoice = null) {
    this.log.info(`Delegating play to orchestrator. [playerId=${userId}] [gameId=${gameId}] [card=${JSON.stringify(playedCard)}]`);
    const updated = await this.orchestrator.play(userId, gameId, playedCard, colorChoice);
    return updated;
  }

  /**
   * Finishes an existing game.
   *
   * @param {string} userId - The id of the user finishing the game (owner).
   * @param {string} gameId - The ID of the game to finish.
   * @returns {Promise<import("mongoose").Document>} The updated game document.
   * @throws {BusinessError} If the user is not the owner of the game or the game is not active.
   * @throws {NotFoundError} If no game is found.
   */
  async finishedGame(userId, gameId) {
    const ownerId = userId;
    this.log.info(
      `owner want to finish the game. [ownerId=${ownerId}] [gameId=${gameId}]`,
    );
    const game = await this.getById(gameId);
    if (game.owner.toString() !== ownerId) {
      this.log.warn(
        `To finish game just owner. [ownerId=${ownerId}] [gameId=${gameId}]`,
      );
      throw new BusinessError("Player is not owner to finish game.");
    }
    if (game.status !== GAME_STATUS.ACTIVE) {
      this.log.warn(
        `Game not finisheable. [gameId=${gameId}] [status=${game.status}]`,
      );
      throw new BusinessError(
        "Cannot finish a game that already is not active",
      );
    }
    game.status = GAME_STATUS.FINISHED;
    const gameUpdated = await this.gameRepository.update(gameId, game);
    this.log.info(`Game finished. [ownerId=${ownerId}] [gameId=${gameId}]`);
    return gameUpdated;
  }

  /**
   * Updates allowed fields of a non-finished game.
   *
   * @param {string} id - The game's MongoDB ObjectId as string.
   * @param {Partial<{ title: string, maxPlayers: number, status: string }>} data - Fields to update.
   * @returns {Promise<import("mongoose").Document>} The updated game.
   * @throws {IlegalInputError} If the payload is invalid or empty.
   * @throws {NotFoundError} If no game is found.
   * @throws {BusinessError} If the game is already finished.
   */
  async update(id, data) {

    const validData = parseOrThrow(UpdateGameRequestDto, data);

    this.log.info(`Updating game by id. [id=${id}]`);

    const game = await this.gameRepository.getById(id);

    if (!game) {
      this.log.warn({ gameId: id }, "Attempt to update non-existing game");
      throw new NotFoundError("Game not found");
    }

    if (game.status === GAME_STATUS.FINISHED) {
      this.log.warn({ gameId: id }, "Attempt to update a finished game");
      throw new BusinessError("Finished games cannot be updated");
    }

    const updatedGame = await this.gameRepository.update(id, validData);

    this.log.info(
      { gameId: id, fields: Object.keys(validData) },
      "Game updated",
    );

    return updatedGame;
  }

  /**
   * Deletes a game by its ID.
   *
   * @param {string} id - The game's MongoDB ObjectId as string.
   * @returns {Promise<import("mongoose").Document>} The deleted game document.
   * @throws {NotFoundError} If no game is found.
   * @throws {BusinessError} If the game is already finished.
   */
  async deleteById(id) {

    this.log.info(`Deleting delete by id. [id=${id}]`);

    const game = await this.gameRepository.getById(id);

    if (!game) {

      this.log.warn({ gameId: id }, "Attempt to delete non-existing game");
      throw new NotFoundError("Game not found");

    }

    if (game.status === GAME_STATUS.FINISHED) {

      this.log.warn({ gameId: id }, "Attempt to delete a finished game");
      throw new BusinessError("Finished games cannot be deleted");

    }

    const deleted = await this.gameRepository.deleteById(id);
    this.log.info({ gameId: id }, "Game deleted");

    return deleted;
  }
}
