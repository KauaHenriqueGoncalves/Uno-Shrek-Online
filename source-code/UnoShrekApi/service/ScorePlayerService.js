import PinoGlobal from "./../config/logger/PinoGlobal.js";
import { NotFoundError } from "../config/exceptions/NotFoundError.js";
import { BusinessError } from "../config/exceptions/BusinessError.js";
import { parseOrThrow } from "./../config/utils/validate.js";
import CreateScorePlayerRequestDto from "./../dtos/request/CreateScorePlayerRequestDto.js";
import UpdateScorePlayerRequestDto from "./../dtos/request/UpdateScorePlayerRequesDto.js";
import mongoose from "mongoose";
import ScorePlayerRepository from "../repository/ScorePlayerRepository.js";

export default class ScorePlayerService {
  constructor(schema, playerService, gameService) {
    this.scorePlayerRepository = new ScorePlayerRepository(schema);
    this.playerService = playerService;
    this.gameService = gameService; // TODO: Ainda vai subir na MAIN
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
    // TODO: Tirar comentario quando subir o GameService na Main
    // const game = await this.gameService.getById(validData.gameId);
    // if (!game) {
    //   this.log.warn(
    //     { gameId: validData.gameId },
    //     "gameId not found to create a scorePlayer",
    //   );
    //   throw new NotFoundError("Game not found");
    // }
    const score = await this.scorePlayerRepository.create(validData);
    this.log.info(
      `Create ScorePlayer success. [playerId=${validData.playerId}] [gameId=${validData.gameId}]`,
    );
    return score;
  }

  async update(id, data) {
    const validData = parseOrThrow(UpdateScorePlayerRequestDto, data);
    this.log.info(`Updating ScorePlayer by id. [id=${id}]`);
    // const player = await this.playerRepository.getById(id);
    // if (!player) {
    //   this.log.warn({ playerId: id }, "Attempt to update non-existing player");
    //   throw new NotFoundError("Player not found");
    // }
    // if (validData.email && validData.email !== player.email) {
    //   const existingEmail = await this.playerRepository.getByEmail(
    //     validData.email,
    //   );
    //   if (existingEmail) {
    //     this.log.warn(
    //       { playerId: id, email: validData.email },
    //       "Attempt to update player with existing email",
    //     );
    //     throw new BusinessError("Email already exists");
    //   }
    // }
    // const updatedPlayer = await this.playerRepository.update(id, validData);
    // this.log.info(
    //   { playerId: id, fields: Object.keys(validData) },
    //   "Player updated",
    // );
    // return updatedPlayer;
  }

  async deleteById(id) {
    this.log.info(`Deleting ScorePlayer by id. [id=${id}]`);
    // const player = await this.playerRepository.getById(id);
    // if (!player) {
    //   this.log.warn({ playerId: id }, "Attempt to delete non-existing player");
    //   throw new NotFoundError("Player not found");
    // }
    // const deleted = await this.playerRepository.deleteById(id);
    // this.log.info({ playerId: id }, "Player deleted");
    // return deleted;
  }
}
