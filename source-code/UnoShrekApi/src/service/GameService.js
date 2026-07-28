import GameRepository from "./../repository/GameRepository.js";
import PinoGlobal from "./../config/logger/PinoGlobal.js";
import { NotFoundError } from "../config/exceptions/NotFoundError.js";
import { BusinessError } from "../config/exceptions/BusinessError.js";
import { CreateGameRequestDto } from "../dtos/request/game/CreateGameRequestDto.js";
import { UpdateGameRequestDto } from "../dtos/request/game/UpdateGameRequestDto.js";
import { GAME_STATUS } from "../schema/Game.js";
import { parseOrThrow } from "./../config/utils/validate.js";
import JwtCoder from "../config/jwt/JwtCoder.js";

export default class GameService {
  constructor(schema) {
    this.gameRepository = new GameRepository(schema);
    this.jwtCoder = JwtCoder.getInstance();
    this.log = PinoGlobal.getInstance();
  }

  async getAll() {
    this.log.info("Getting all games");
    const games = await this.gameRepository.getAll();
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

  async create(token, data) {
    const validData = parseOrThrow(CreateGameRequestDto, data);
    this.log.info(
      `Creating a game. [title=${validData.title}] [maxPlayers=${validData.maxPlayers}]`,
    );
    const tokenDecode = this.jwtCoder.decode(token);
    const ownerId = tokenDecode.id;
    this.log.info(`Owner of game. [ownerId=${ownerId}]`);
    const dataSave = { ...validData, owner: ownerId };
    console.log(dataSave);
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
    if (game.players.some((id) => id.toString() === playerId)) {
      this.log.warn(
        `Player already in game. [playerId=${playerId}] [gameId=${gameId}]`,
      );
      throw new BusinessError("Player already joined this game");
    }
    game.players.push(playerId);
    const gameUpdate = await this.gameRepository.update(gameId, game);
    this.log.info(
      `Player added on game. [playerId=${playerId}] [gameId=${gameId}]`,
    );
    return gameUpdate;
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
