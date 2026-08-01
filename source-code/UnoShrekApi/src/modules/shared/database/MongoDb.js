import mongoose from "mongoose";
import PinoGlobal from "../logger/PinoGlobal.js";
import { DatabaseConnectionError } from "../exceptions/DatabaseConnectionError.js";

export default class MongoDb {
  constructor() {
    this.database = mongoose;
    this.log = PinoGlobal.getInstance();
    this.user = process.env.MONGODB_USER;
    this.password = process.env.MONGODB_PASSWORD;
    this.host = process.env.MONGODB_HOST;
    this.port = process.env.MONGODB_PORT;
    this.name = process.env.MONGODB_NAME;
  }

  async connect() {
    await this.database
      .connect(
        `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.name}?authSource=admin`,
      )
      .then(() => {
        this.log.info("Connection to MongoDB successful");
      })
      .catch((error) => {
        this.log.error({ err: error }, "Failed connection to MongoDb: ");
        throw new DatabaseConnectionError();
      });
  }
}
