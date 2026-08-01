import CrudRepository from "../repository/CrudRepository.js";

export default class BlacklistedTokenRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  async existsByToken(token, session = null) {
    const doc = await this.schema.findOne({ token }).session(session);
    return !!doc;
  }
}
