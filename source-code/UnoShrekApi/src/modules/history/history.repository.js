import CrudRepository from "../shared/repository/crud.repository.js";

export default class HistoryRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  async getByPlayerId(playerId) {
    return await this.schema.find({ player: playerId }).sort({ createdAt: -1 });
  }
}
