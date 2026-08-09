import CrudRepository from "../shared/repository/crud.repository.js";

export default class ScorePlayerRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  async getByGameId(gameId) {
    return await this.schema.find({ gameId });
  }
}
