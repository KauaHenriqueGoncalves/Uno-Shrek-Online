import PlayerRepository from "./../repository/PlayerRepository.js";
import { NotFoundError } from "../config/exceptions/NotFoundError.js";
import { BusinessError } from "../config/exceptions/BusinessError.js";
import { z } from "zod";
import mongoose from "mongoose";
import { IlegalInputError } from "../config/exceptions/IlegalInputError.js";

export default class PlayerService {
  constructor(schema) {
    this.playerRepository = new PlayerRepository(schema);
  }

  //
  //  TODO: MELHORAR O TRATAMENTO DO INPUT
  //

  static playerValidation = z.object({
    name: z.string().trim().min(3).max(50),
    age: z.number().int().min(1).max(120),
    email: z.email(),
  });

  async getById(id) {
    const player = await this.playerRepository.getById(id);
    if (!player) {
      throw new NotFoundError("Player not found");
    }
    return player;
  }

  async create(data) {
    this.validatePlayer(data);
    const isExistEmail = await this.playerRepository.getByEmail(data.email);
    if (isExistEmail) {
      throw new BusinessError("Email already exists");
    }
    return await this.playerRepository.create(data);
  }

  async update(id, data) {}

  async deleteById(id) {}

  validatePlayer(data) {
    const result = PlayerService.playerValidation.safeParse(data);
    if (!result.success) {
      throw new IlegalInputError("Player input is not valid");
    }
    return result.data;
  }
}
