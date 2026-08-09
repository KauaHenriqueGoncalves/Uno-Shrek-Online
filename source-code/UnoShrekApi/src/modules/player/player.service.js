import PlayerRepository from "./player.repository.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { NotFoundError } from "../shared/errors/not-found.error.js";
import { BusinessError } from "../shared/errors/business.error.js";
import { CreatePlayerRequestDto } from "./dto/create-player.request.dto.js";
import { UpdatePlayerRequestDto } from "./dto/update.player.request.dto.js";
import { parseOrThrow } from "../shared/utils/validate.js";
import JwtCoder from "../shared/jwt/jwt-coder.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export default class PlayerService {
  constructor(schema) {
    this.playerRepository = new PlayerRepository(schema);
    this.jwtCoder = JwtCoder.getInstance();
    this.log = PinoGlobal.getInstance();
  }

  async getAll() {
    this.log.info("Getting all players");
    const players = await this.playerRepository.getAll();
    return players;
  }

  async getAllByIds(ids) {
    this.log.info(`Getting all players by ids [ids=${ids}]`);
    const players = await this.playerRepository.getAllByIds(ids);
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

  async getByUsername(username) {
    this.log.info(`Getting player by username [username=${username}]`);
    const player = await this.playerRepository.getByUsername(username);
    if (!player) {
      this.log.warn({ username: username }, "Player not found");
      throw new NotFoundError("Player not found");
    }
    return player;
  }

  async getByToken(token) {
    const tokenDecode = this.jwtCoder.decode(token);
    const id = tokenDecode.id;
    this.log.info(`Getting by own user. [id=${id}]`);
    const player = await this.getById(id);
    return player;
  }

  async create(data) {
    const validData = parseOrThrow(CreatePlayerRequestDto, data);
    this.log.info(
      `Creating a player. [email=${validData.email}] [username=${validData.username}]`,
    );
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
    const isExistUsername = await this.playerRepository.getByUsername(
      validData.username,
    );
    if (isExistUsername) {
      this.log.warn(
        { username: validData.username },
        "Attempt to create player with existing username",
      );
      throw new BusinessError("Username already exists");
    }
    const hashedPassword = await bcrypt.hash(validData.password, SALT_ROUNDS);
    const player = await this.playerRepository.create({
      ...validData,
      password: hashedPassword,
    });
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
