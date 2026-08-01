import GameRepository from "./../repository/GameRepository.js";
import PinoGlobal from "./../config/logger/PinoGlobal.js";
import { NotFoundError } from "../config/exceptions/NotFoundError.js";
import { BusinessError } from "../config/exceptions/BusinessError.js";
import { CreateGameRequestDto } from "../dtos/request/game/CreateGameRequestDto.js";
import { UpdateGameRequestDto } from "../dtos/request/game/UpdateGameRequestDto.js";
import { GAME_STATUS } from "../schema/Game.js";
import { GameStatusDto } from "../dtos/request/game/GameStatusDto.js";
import { parseOrThrow } from "./../config/utils/validate.js";
import JwtCoder from "../config/jwt/JwtCoder.js";

export default class GameService {
  constructor(schema, playerService) {
    this.gameRepository = new GameRepository(schema);
    this.playerService = playerService;
    this.jwtCoder = JwtCoder.getInstance();
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
    const game = await this.getById(id);
    const ids = game.players.map((p) => p.player.toString());
    const players = await this.playerService.getAllByIds(ids);
    return { game, players };
  }

  async getCurrentScoreById(id) {
    this.log.info(`Getting current score by game id [id=${id}]`);
    const game = await this.getById(id);
    const ids = game.players.map((p) => p.player.toString());
    const players = await this.playerService.getAllByIds(ids);
    const scores = game.players.map((p) => {
      const player = players.find((player) => player._id.toString() === p.player.toString());
      const username = player ? player.username : "Unknown";
      return {
        playerId: p.player.toString(),
        username: username,
        score: p.score,
      };
    });
    return { game, scores };
  }

  async getCurrentPlayersById(id) {
    this.log.info(`Getting current players by game id [id=${id}]`);
    const game = await this.getById(id);
    const ids = game.players.map((p) => p.player);
    const players = await this.playerService.getAllByIds(ids);
    return { game, players };
  }

  async create(token, data) {
    const validData = parseOrThrow(CreateGameRequestDto, data);
    this.log.info(
      `Creating a game. [title=${validData.title}] [maxPlayers=${validData.maxPlayers}]`,
    );
    const tokenDecode = this.jwtCoder.decode(token);
    const ownerId = tokenDecode.id;
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

  async joinInGame(token, gameId) {
    const tokenDecode = this.jwtCoder.decode(token);
    const playerId = tokenDecode.id;
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

  async leaveGame(token, gameId) {
    const tokenDecode = this.jwtCoder.decode(token);
    const playerId = tokenDecode.id;
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

  async readyInGame(token, gameId) {
    const tokenDecode = this.jwtCoder.decode(token);
    const playerId = tokenDecode.id;
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

  async notReadyInGame(token, gameId) {
    const tokenDecode = this.jwtCoder.decode(token);
    const playerId = tokenDecode.id;
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
    condicionPlayer.ready = false;
    const gameUpdate = await this.gameRepository.update(gameId, game);
    this.log.info(`Player is ready. [playerId=${playerId}] [gameId=${gameId}]`);
    return gameUpdate;
  }

  async startGame(token, gameId) {
    const tokenDecode = this.jwtCoder.decode(token);
    const ownerId = tokenDecode.id;
    this.log.info(
      `owner want to start the game. [ownerId=${ownerId}] [gameId=${gameId}]`,
    );
    const game = await this.getById(gameId);
    if (game.owner.toString() !== ownerId) {
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
    game.status = GAME_STATUS.ACTIVE;
    const gameUpdate = await this.gameRepository.update(gameId, game);
    this.log.info(`Game started. [ownerId=${ownerId}] [gameId=${gameId}]`);
    return gameUpdate;
  }

  async finishedGame(token, gameId) {
    const tokenDecode = this.jwtCoder.decode(token);
    const ownerId = tokenDecode.id;
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
}
