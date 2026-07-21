import CrudRepository from "./CrudRepository.js";
import mongoose from "mongoose";

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
}
