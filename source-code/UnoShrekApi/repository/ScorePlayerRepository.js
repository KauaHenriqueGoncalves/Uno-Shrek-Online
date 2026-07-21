import CrudRepository from "./CrudRepository.js";
import mongoose from "mongoose";

export default class ScorePlayerRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }
}
