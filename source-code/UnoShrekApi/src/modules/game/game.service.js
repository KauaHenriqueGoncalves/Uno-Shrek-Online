import GameRepository from "./game.repository.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { NotFoundError } from "../shared/errors/not-found.error.js";
import { BusinessError } from "../shared/errors/business.error.js";
import { UnauthorizedError } from "../shared/errors/unauthorized.error.js"
import { CreateGameRequestDto } from "./dto/create-game.request.dto.js";
import { UpdateGameRequestDto } from "./dto/update-game.request.dto.js";
import { GAME_STATUS } from "./game.schema.js";
import { GameStatusDto } from "./dto/game-status.request.dto.js";
import { parseOrThrow } from "../shared/utils/validate.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export default class GameService {
  constructor(schema, orchestrator) {
    this.gameRepository = new GameRepository(schema);
    this.orchestrator = orchestrator;
    this.log = PinoGlobal.getInstance();
  }

  async getAll() {
    this.log.info("Getting all games");
    const games = await this.gameRepository.getAll();
    return games;
  }

  async getAllByStatus(status) {
    this.log.info(`Getting all games by status. [status=${status}]`);
    const validData = parseOrThrow(GameStatusDto, { status });
    const games = await this.gameRepository.getAllByStatus(validData.status);
    return games;
  }

  async getById(id) {
    this.log.info(`Getting game by id [id=${id}]`);
    const game = await this.gameRepository.getById(id);
    if (!game) {
      this.log.warn({ gameId: id }, "Game not found");
      throw new NotFoundError("Game not found");
    }
    return game;
  }

  async getByIdInfo(id) {
    this.log.info(`Getting game info by id [id=${id}]`);
    const game = await this.orchestrator.getFullGame(id);
    return { game };
  }

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
    const hashedPassword = await bcrypt.hash(validData.password, SALT_ROUNDS);
    const dataSave = {
      ...validData,
      password: hashedPassword,
      owner: ownerId,
      players: [{ player: ownerId, ready: false, score: 0 }],
    };
    const game = await this.gameRepository.create(dataSave);
    this.log.info(
      `Game created. [gameId=${game._id.toString()}] [ownerId=${ownerId}]`,
    );
    const { game: gameWithScore } =
      await this.orchestrator.createScorePlayerFor(
        ownerId,
        game._id.toString(),
      );
    this.log.info({ gameId: game._id.toString() }, "Game created");
    return gameWithScore;
  }

  async joinInGame(userId, gameId, password) {
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
    if (!password) {
      this.log.warn(`Invalid password. [userId=${userId}] [gameId=${gameId}]`);
      throw new BusinessError("Invalind password");
    }
    const passwordMatches = await bcrypt.compare(password, game.password);
    if (!passwordMatches) {
      this.log.warn(`Invalid password in game. [userId=${userId}] [gameId=${gameId}]`);
      throw new UnauthorizedError("Invalid credentials to game");
    }
    game.players.push({ player: playerId, ready: false });
    await this.gameRepository.update(gameId, game);
    const { game: gameUpdate } = await this.orchestrator.createScorePlayerFor(
      playerId,
      gameId,
    );
    this.log.info(
      `Player added on game. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    return gameUpdate;
  }

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
    this.log.info(
      `Player is not ready. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    return gameUpdate;
  }

  async updatePlayerScore(userId, gameId, score) {
    const playerId = userId;
    this.log.info(
      `Updating player score. [playerId=${playerId}] [gameId=${gameId}] [score=${score}]`,
    );
    const updatedGame = await this.orchestrator.updateScore(
      playerId,
      gameId,
      score,
    );
    return updatedGame;
  }

  async startGame(userId, gameId) {
    this.log.info(
      `Delegating start to orchestrator. [ownerId=${userId}] [gameId=${gameId}]`,
    );
    const updated = await this.orchestrator.start(userId, gameId);
    return updated;
  }

  async draw(userId, gameId) {
    this.log.info(
      `Delegating draw to orchestrator. [playerId=${userId}] [gameId=${gameId}]`,
    );
    return await this.orchestrator.draw(userId, gameId);
  }

  async play(userId, gameId, cardId, colorChoice = null) {
    this.log.info(
      `Delegating play to orchestrator. [playerId=${userId}] [gameId=${gameId}] [cardId=${cardId}] [colorChoice=${colorChoice}]`,
    );
    return await this.orchestrator.play(userId, gameId, cardId, colorChoice);
  }

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

  async addBot(gameId) {
    return await this.orchestrator.addBotToGame(gameId);
  }

  
}
