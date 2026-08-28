import CrudRepository from "../shared/repository/crud.repository.js";

export default class TrackingRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }
}
