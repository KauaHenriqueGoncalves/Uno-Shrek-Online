import CrudRepository from "../shared/repository/crud.repository.js";
import mongoose from "mongoose";
import { GAME_STATUS } from "./game.schema.js";

export default class GameRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  async findByStatus(status, { session = null, limit = 0 } = {}) {
    const query = this.schema.find({ status });
    if (session) {
      query.session(session);
    }
    if (limit > 0) {
      query.limit(limit);
    }
    return await query.exec();
  }

  async getAllByStatus(status, session = null) {
    return await this.schema.find({ status }).session(session);
  }

  async getActiveGameByOwner(ownerId, session = null) {
    return await this.schema
      .findOne({
        owner: ownerId,
        status: { $ne: GAME_STATUS.FINISHED },
      })
      .session(session);
  }
}
