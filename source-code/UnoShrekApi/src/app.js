import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import PinoGlobal from "./modules/shared/logger/PinoGlobal.js";
import HealthController from "./modules/health/HealthController.js";
import MongoDb from "./config/database/MongoDb.js";
import errorHandler from "./modules/shared/middleware/errorHandler.js";
import PlayerService from "./modules/player/PlayerService.js";
import Player from "./modules/player/Player.js";
import PlayerController from "./modules/player/PlayerController.js";
import GameService from "./modules/game/GameService.js";
import Game from "./modules/game/Game.js";
import GameController from "./modules/game/game.controller.js";
import Card from "./modules/card/Card.js";
import CardService from "./modules/card/CardService.js";
import CardController from "./modules/card/CardController.js";
import ScorePlayer from "./modules/score/ScorePlayer.js";
import ScorePlayerService from "./modules/score/ScorePlayerService.js";
import ScorePlayerController from "./modules/score/ScorePlayerController.js";
import LoginService from "./modules/auth/LoginService.js";
import AuthController from "./modules/auth/AuthController.js";
import TokenService from "./modules/auth/TokenService.js";

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

      const loginService = new LoginService(playerService);
      const tokenService = new TokenService();
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
