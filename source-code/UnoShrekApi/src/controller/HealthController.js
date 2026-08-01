import express from "express";
import PinoGlobal from "./../config/logger/PinoGlobal.js";
import { ApiError } from "../config/exceptions/ApiError.js";
import asyncHandler from "../config/utils/asyncHandler.js";

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
