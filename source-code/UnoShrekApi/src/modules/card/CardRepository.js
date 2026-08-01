import CrudRepository from "../shared/repository/CrudRepository.js";

export default class CardRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }
}
