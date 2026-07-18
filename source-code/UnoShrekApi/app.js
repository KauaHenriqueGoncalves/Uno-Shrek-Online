import express from "express";
import morgan from "morgan";
import PinoGlobal from "./config/logger/PinoGlobal.js";
import HealthController from "./controller/HealthController.js";
import MongoDb from "./config/database/MongoDb.js";
import errorHandler from "./config/middleware/errorHandler.js";
import PlayerService from "./service/PlayerService.js";
import Player from "./schema/Player.js";
import PlayerController from "./controller/PlayerController.js";
import GameService from "./service/GameService.js";
import Game from "./schema/Game.js";
import GameController from "./controller/GameController.js";

export default class App {
  constructor() {
    this.express = express();
    this.mongo = new MongoDb();
    this.log = PinoGlobal.getInstance();
  }

  async init() {
    await this.connectDatabase();
    this.middlewares();
    this.dependecies();
    this.controllers();
    this.errorMiddlewares();
  }

  async connectDatabase() {
    await this.mongo.connect();
  }

  middlewares() {
    try {
      this.express.use(express.json());
      this.express.use(morgan("dev"));
      this.log.info("Morgan is working to loggind middleware.");
    } catch (error) {
      this.log.error({ err: error }, "It was not possible to use Morgan for logging.");
    }
  }

  errorMiddlewares() {
    try {
      this.express.use(errorHandler);
      this.log.info("Error Middleware is working.");
    } catch (error) {
      this.log.error({ err: error }, "It was not possible to use error handler middleware.");
    }
  }

  dependecies() {
    this.healthController = new HealthController();
    const playerService = new PlayerService(Player);
    this.playerController = new PlayerController(playerService);

    const gameService = new GameService(Game);
    this.gameController = new GameController(gameService);
  }

  controllers() {
    try {
      this.express.use("/api/health", this.healthController.routers);
      this.express.use("/api/players", this.playerController.routers);
      this.express.use("/api/games", this.gameController.routers);
      this.log.info("Established routes");
    } catch (error) {
      this.log.error({ err: error }, "The routers from controller isn't working correctly.");
    }
  }
}