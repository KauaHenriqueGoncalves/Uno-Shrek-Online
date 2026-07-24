import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
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
import Card from "./schema/Card.js";
import CardService from "./service/CardService.js";
import CardController from "./controller/CardController.js";
import ScorePlayer from "./schema/ScorePlayer.js";
import ScorePlayerService from "./service/ScorePlayerService.js";
import ScorePlayerController from "./controller/ScorePlayerController.js";
import LoginService from "./service/LoginService.js";
import AuthController from "./controller/AuthController.js";

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
      this.express.use(cookieParser());
      this.express.use(
        cors({
          origin: process.env.FRONTEND_URL ?? "*",
          credentials: true,
        }),
      );
      this.log.info("Middlewares configured.");
    } catch (error) {
      this.log.error({ err: error }, "Somethings is wrong in the middleware.");
    }
  }

  errorMiddlewares() {
    try {
      this.express.use(errorHandler);
      this.log.info("Handler error Middleware configured.");
    } catch (error) {
      this.log.error(
        { err: error },
        "It was not possible to use error handler middleware.",
      );
    }
  }

  dependecies() {
    try {
      this.healthController = new HealthController();

      const playerService = new PlayerService(Player);
      this.playerController = new PlayerController(playerService);

      const gameService = new GameService(Game);
      this.gameController = new GameController(gameService);

      const cardService = new CardService(Card, gameService);
      this.cardController = new CardController(cardService);

      const scorePlayerService = new ScorePlayerService(
        ScorePlayer,
        playerService,
        gameService,
      );
      this.scorePlayerController = new ScorePlayerController(
        scorePlayerService,
      );

      const loginService = new LoginService(playerService);
      this.authController = new AuthController(loginService);
    } catch (error) {
      this.log.error(
        { err: error },
        "Somethings is wrong in the dependencies.",
      );
    }
  }

  controllers() {
    try {
      this.express.use("/api/health", this.healthController.routers);
      this.express.use("/api/players", this.playerController.routers);
      this.express.use("/api/games", this.gameController.routers);
      this.express.use("/api/scores", this.scorePlayerController.routers);
      this.express.use("/api/cards", this.cardController.routers);
      this.express.use("/api/auth", this.authController.routers);
      this.log.info("Established routes");
    } catch (error) {
      this.log.error(
        { err: error },
        "The routers from controller isn't working correctly.",
      );
    }
  }
}
