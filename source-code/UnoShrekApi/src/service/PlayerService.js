import PlayerRepository from "./../repository/PlayerRepository.js";
import PinoGlobal from "./../config/logger/PinoGlobal.js";
import { NotFoundError } from "../config/exceptions/NotFoundError.js";
import { BusinessError } from "../config/exceptions/BusinessError.js";
import { CreatePlayerRequestDto } from "../dtos/request/player/CreatePlayerRequestDto.js";
import { UpdatePlayerRequestDto } from "../dtos/request/player/UpdatePlayerRequestDto.js";
import { parseOrThrow } from "./../config/utils/validate.js";
import mongoose from "mongoose";

export default class PlayerService {
  constructor(schema) {
    this.playerRepository = new PlayerRepository(schema);
    this.log = PinoGlobal.getInstance();
  }

  async getAll() {
    this.log.info("Getting all players");
    const players = await this.playerRepository.getAll();
    return players;
  }

  async getById(id) {
    this.log.info(`Getting player by id [id=${id}]`);
    const player = await this.playerRepository.getById(id);
    if (!player) {
      this.log.warn({ playerId: id }, "Player not found");
      throw new NotFoundError("Player not found");
    }
    return player;
  }

  async create(data) {
    const validData = parseOrThrow(CreatePlayerRequestDto, data);
    this.log.info(`Creating a player. [email=${validData.email}] [username=${validData.name}]`);
    const isExistEmail = await this.playerRepository.getByEmail(
      validData.email,
    );
    if (isExistEmail) {
      this.log.warn(
        { email: validData.email },
        "Attempt to create player with existing email",
      );
      throw new BusinessError("Email already exists");
    }
    const player = await this.playerRepository.create(validData);
    this.log.info(
      { playerId: player._id.toString(), email: player.email },
      "Player created",
    );
    return player;
  }

  async update(id, data) {
    const validData = parseOrThrow(UpdatePlayerRequestDto, data);
    this.log.info(`Updating player by id. [id=${id}]`);
    const player = await this.playerRepository.getById(id);
    if (!player) {
      this.log.warn({ playerId: id }, "Attempt to update non-existing player");
      throw new NotFoundError("Player not found");
    }
    if (validData.email && validData.email !== player.email) {
      const existingEmail = await this.playerRepository.getByEmail(
        validData.email,
      );
      if (existingEmail) {
        this.log.warn(
          { playerId: id, email: validData.email },
          "Attempt to update player with existing email",
        );
        throw new BusinessError("Email already exists");
      }
    }
    const updatedPlayer = await this.playerRepository.update(id, validData);
    this.log.info(
      { playerId: id, fields: Object.keys(validData) },
      "Player updated",
    );
    return updatedPlayer;
  }

  async deleteById(id) {
    this.log.info(`Deleting player by id. [id=${id}]`);
    const player = await this.playerRepository.getById(id);
    if (!player) {
      this.log.warn({ playerId: id }, "Attempt to delete non-existing player");
      throw new NotFoundError("Player not found");
    }
    const deleted = await this.playerRepository.deleteById(id);
    this.log.info({ playerId: id }, "Player deleted");
    return deleted;
  }
}
