import PinoGlobal from "../shared/logger/PinoGlobal.js";
import { NotFoundError } from "../shared/exceptions/NotFoundError.js";
import { parseOrThrow } from "../shared/utils/validate.js";
import { CreateScorePlayerRequestDto } from "./dto/CreateScorePlayerRequestDto.js";
import { UpdateScorePlayerRequestDto } from "./dto/UpdateScorePlayerRequestDto.js";
import ScorePlayerRepository from "./ScorePlayerRepository.js";

export default class ScorePlayerService {
  constructor(schema, playerService, gameService) {
    this.scorePlayerRepository = new ScorePlayerRepository(schema);
    this.playerService = playerService;
    this.gameService = gameService;
    this.log = PinoGlobal.getInstance();
  }

  async getAll() {
    this.log.info("Getting all score players");
    const scores = await this.scorePlayerRepository.getAll();
    return scores;
  }

  async getById(id) {
    this.log.info(`Getting scorePlayer by id [id=${id}]`);
    const score = await this.scorePlayerRepository.getById(id);
    if (!score) {
      this.log.warn({ scorePlayerId: id }, "ScorePlayer not found");
      throw new NotFoundError("ScorePlayer not found");
    }
    return score;
  }

  async getByIdDetails(id) {
    this.log.info(`Getting scorePlayer by id details [id=${id}]`);
    const score = await this.scorePlayerRepository.getById(id);
    if (!score) {
      this.log.warn({ scorePlayerId: id }, "ScorePlayer not found");
      throw new NotFoundError("ScorePlayer not found");
    }
    const player = await this.playerService.getById(score.playerId);
    const game = await this.gameService.getById(score.gameId);
    return { score, player, game };
  }

  async create(data) {
    const validData = parseOrThrow(CreateScorePlayerRequestDto, data);
    this.log.info(
      `Creating a scorePlayer. [playerId=${validData.playerId}] [gameId=${validData.gameId}]`,
    );
    const player = await this.playerService.getById(validData.playerId);
    if (!player) {
      this.log.warn(
        { playerId: validData.playerId },
        "PlayerId not found to create a scorePlayer",
      );
      throw new NotFoundError("Player not found");
    }
    const game = await this.gameService.getById(validData.gameId);
    if (!game) {
      this.log.warn(
        { gameId: validData.gameId },
        "gameId not found to create a scorePlayer",
      );
      throw new NotFoundError("Game not found");
    }
    const score = await this.scorePlayerRepository.create(validData);
    this.log.info(
      `Create ScorePlayer success. [playerId=${validData.playerId}] [gameId=${validData.gameId}]`,
    );
    return score;
  }

  async update(id, data) {
    const validData = parseOrThrow(UpdateScorePlayerRequestDto, data);
    this.log.info(`Updating ScorePlayer by id. [id=${id}]`);
    const score = await this.scorePlayerRepository.getById(id);
    if (!score) {
      this.log.warn(
        { scorePlayerId: id },
        "Attempt to update non-existing scorePlayer",
      );
      throw new NotFoundError("ScorePlayer not found");
    }
    const player = await this.playerService.getById(validData.playerId);
    if (!player) {
      this.log.warn(
        { playerId: validData.playerId },
        "PlayerId not found to create a scorePlayer",
      );
      throw new NotFoundError("Player not found");
    }
    const game = await this.gameService.getById(validData.gameId);
    if (!game) {
      this.log.warn(
        { gameId: validData.gameId },
        "gameId not found to create a scorePlayer",
      );
      throw new NotFoundError("Game not found");
    }
    const updatedScore = await this.scorePlayerRepository.update(id, validData);
    this.log.info(
      { scorePlayerId: id, fields: Object.keys(validData) },
      "ScorePlayer updated",
    );
    return updatedScore;
  }

  async deleteById(id) {
    this.log.info(`Deleting ScorePlayer by id. [id=${id}]`);
    const score = await this.scorePlayerRepository.getById(id);
    if (!score) {
      this.log.warn(
        { scorePlayerId: id },
        "Attempt to delete non-existing scorePlayer",
      );
      throw new NotFoundError("ScorePlayer not found");
    }
    const deleted = await this.scorePlayerRepository.deleteById(id);
    this.log.info({ scorePlayerId: id }, "ScorePlayer deleted");
    return deleted;
  }

  async getByGameId(gameId) {
    this.log.info(`Getting scores by game id [gameId=${gameId}]`);
    const game = await this.gameService.getById(gameId);
    // will throw if game not found
    const scores = await this.scorePlayerRepository.getByGameId(gameId);
    const results = [];
    for (const score of scores) {
      const player = await this.playerService.getById(score.playerId);
      results.push({ score, player, game });
    }
    return results;
  }
}
