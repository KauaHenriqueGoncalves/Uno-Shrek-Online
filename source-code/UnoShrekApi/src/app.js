import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import PinoGlobal from "./modules/shared/logger/pino-global.logger.js";
import HealthController from "./modules/health/health.controller.js";
import MongoDb from "./modules/shared/database/mongo-db.js";
import errorHandler from "./modules/shared/middleware/error-handler.middleware.js";
import PlayerService from "./modules/player/player.service.js";
import Player from "./modules/player/player.schema.js";
import PlayerController from "./modules/player/player.controller.js";
import GameService from "./modules/game/game.service.js";
import Game from "./modules/game/game.schema.js";
import GameController from "./modules/game/game.controller.js";
import Card from "./modules/card/card.schema.js";
import CardService from "./modules/card/card.service.js";
import CardController from "./modules/card/card.controller.js";
import ScorePlayer from "./modules/score/score-player.schema.js";
import ScorePlayerService from "./modules/score/score-player.service.js";
import ScorePlayerController from "./modules/score/score-player.controller.js";
import LoginService from "./modules/auth/login.service.js";
import AuthController from "./modules/auth/auth.controller.js";
import TokenService from "./modules/auth/token.service.js";

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

      const gameService = new GameService(Game, playerService);
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

      const tokenService = new TokenService();
      const loginService = new LoginService(playerService);
      this.authController = new AuthController(loginService, playerService, tokenService);

      this.services = {
        playerService,
        gameService,
        cardService,
        scorePlayerService,
        loginService,
        tokenService,
      };
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
