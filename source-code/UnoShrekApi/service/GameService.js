import GameRepository from "./../repository/GameRepository.js";
import PinoGlobal from "./../config/logger/PinoGlobal.js";
import { NotFoundError } from "../config/exceptions/NotFoundError.js";
import { BusinessError } from "../config/exceptions/BusinessError.js";
import { CreateGameRequestDto } from "../dtos/request/CreateGameRequestDto.js";
import { UpdateGameRequestDto } from "../dtos/request/UpdateGameRequestDto.js";
import { GAME_STATUS } from "../schema/Game.js";
import { parseOrThrow } from "./../config/utils/validate.js";

export default class GameService {
  constructor(schema) {
    this.gameRepository = new GameRepository(schema);
    this.log = PinoGlobal.getInstance();
  }

  async getAll() {
    const games = await this.gameRepository.getAll();
    return games;
  }

  async getById(id) {
    const game = await this.gameRepository.getById(id);
    if (!game) {
      this.log.warn({ gameId: id }, "Game not found");
      throw new NotFoundError("Game not found");
    }
    return game;
  }

  async create(data) {
    const validData = parseOrThrow(CreateGameRequestDto, data);
    const game = await this.gameRepository.create(validData);
    this.log.info({ gameId: game._id.toString() }, "Game created");
    return game;
  }

  async update(id, data) {
    const validData = parseOrThrow(UpdateGameRequestDto, data);
    const game = await this.gameRepository.getById(id);
    if (!game) {
      this.log.warn({ gameId: id }, "Attempt to update non-existing game");
      throw new NotFoundError("Game not found");
    }

    // Sugestão de Regra de Negócio: um jogo finalizado não pode mais ser alterado.
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
    const game = await this.gameRepository.getById(id);
    if (!game) {
      this.log.warn({ gameId: id }, "Attempt to delete non-existing game");
      throw new NotFoundError("Game not found");
    }

    // Mesma regra de negócio aplicada na exclusão.
    if (game.status === GAME_STATUS.FINISHED) {
      this.log.warn({ gameId: id }, "Attempt to delete a finished game");
      throw new BusinessError("Finished games cannot be deleted");
    }

    const deleted = await this.gameRepository.deleteById(id);
    this.log.info({ gameId: id }, "Game deleted");
    return deleted;
  }
}