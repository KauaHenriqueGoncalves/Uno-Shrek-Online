import express from "express";
import PinoGlobal from "./../config/logger/PinoGlobal.js";
import { ApiError } from "../config/exceptions/ApiError.js";

export default class HealthController {
  constructor() {
    this.routers = express.Router();
    this.log = PinoGlobal.getInstance();
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", this.status.bind(this));
  }

  status(req, res) {
    try {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
      this.log.info("Api working correctly.");
    } catch (error) {
      throw new ApiError("There is something wrong! Try again later!");
      this.log.error({ err: error }, "Something is wrong.");
    }
  }
}
