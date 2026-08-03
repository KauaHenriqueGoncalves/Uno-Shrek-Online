import CrudRepository from "../shared/repository/crud.repository.js";
import mongoose from "mongoose";

export default class ScorePlayerRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  async getByGameId(gameId) {
    return await this.schema.find({ gameId });
  }
}
