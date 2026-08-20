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

  async getByIdPopulated(id, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.schema
      .findOne({ _id: id })
      .populate("owner")
      .populate("currentPlayer")
      .populate("unoChallengePlayer")
      .populate("players.player")
      .populate("players.hand.cards")
      .populate("players.scorePlayer")
      .populate({ path: "histories", populate: [{ path: "player" }, { path: "card" }] })
      .populate("deck")
      .populate("discard")
      .session(session);
  }

  async getByCode(code, session = null) {
  return await this.schema.findOne({ code }).session(session);
}

  // busca a primeira sala pending com vaga que o jogador ainda não está
  async findFirstAvailable(userId, session = null) {
    return await this.schema.findOne({
      status: "pending",
      $expr: { $lt: [{ $size: "$players" }, "$maxPlayers"] },
      "players.player": { $ne: userId },
    }).session(session);
}
}
