import CrudRepository from "../shared/repository/CrudRepository.js";
import mongoose from "mongoose";

export default class PlayerRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  async getByUsername(username, session = null) {
    return await this.schema.findOne({ username }).session(session);
  }

  async getByEmail(email, session = null) {
    return await this.schema.findOne({ email }).session(session);
  }
}
