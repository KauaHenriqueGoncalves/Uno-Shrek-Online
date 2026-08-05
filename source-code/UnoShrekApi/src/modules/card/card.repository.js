import CrudRepository from "../shared/repository/crud.repository.js";

export default class CardRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  async createMany(cardsData, session = null) {
    return await this.schema.insertMany(cardsData, { session });
  }
}
