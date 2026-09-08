import express from "express";
import authMiddleware from "../shared/middleware/auth.middleware.js";
import asyncHandler from "../shared/utils/async-handler.js";

export default class TrackingController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get(
      "/requests",
      authMiddleware,
      asyncHandler(this.getRequestStats.bind(this)),
    );
    this.routers.get(
      "/responsetimes",
      authMiddleware,
      asyncHandler(this.getResponseTimeStats.bind(this)),
    );
    this.routers.get(
      "/status-codes",
      authMiddleware,
      asyncHandler(this.getStatusCodeStats.bind(this)),
    );
    this.routers.get(
      "/popular-endpoints",
      authMiddleware,
      asyncHandler(this.getPopularEndpoints.bind(this)),
    );
  }

  async getRequestStats(req, res) {
    const stats = await this.service.getRequestStats();
    return res.status(200).json(stats);
  }

  async getResponseTimeStats(req, res) {
    const stats = await this.service.getResponseTimeStats();
    return res.status(200).json(stats);
  }

  async getStatusCodeStats(req, res) {
    const stats = await this.service.getStatusCodeStats();
    return res.status(200).json(stats);
  }

  async getPopularEndpoints(req, res) {
    const stats = await this.service.getPopularEndpoints();
    return res.status(200).json(stats);
  }
}
