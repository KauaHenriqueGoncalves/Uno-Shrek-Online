import express from "express";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { ApiError } from "../shared/errors/api.error.js";
import asyncHandler from "../shared/utils/async-handler.js";

export default class HealthController {
  constructor() {
    this.routers = express.Router();
    this.log = PinoGlobal.getInstance();
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", asyncHandler(this.status.bind(this)));
  }

  status(req, res) {
    try {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
      this.log.info("Api working correctly.");
    } catch (error) {
      this.log.error({ err: error }, "Something is wrong.");
      throw new ApiError("There is something wrong! Try again later!");
    }
  }
}
