import express from "express";
import HistoryResponseDto from "./response/history.response.dto.js";
import asyncHandler from "../shared/utils/async-handler.js";
import authMiddleware from "../shared/middleware/auth.middleware.js";

export default class HistoryController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", asyncHandler(this.getAll.bind(this)));
    this.routers.get("/player/:playerId", asyncHandler(this.getByPlayerId.bind(this)));
    this.routers.get("/:id/details",asyncHandler(this.getByIdDetails.bind(this)));
    this.routers.get("/:id", asyncHandler(this.getById.bind(this)));
    this.routers.post("/", authMiddleware, asyncHandler(this.create.bind(this)));
    this.routers.delete("/:id", authMiddleware, asyncHandler(this.delete.bind(this)));
  }

  async getAll(req, res) {
    const histories = await this.service.getAll();
    return res.status(200).json(HistoryResponseDto.fromDocumentList(histories));
  }

  async getById(req, res) {
    const history = await this.service.getById(req.params.id);
    return res.status(200).json(HistoryResponseDto.fromDocument(history));
  }

  async getByIdDetails(req, res) {
    const { history, player } = await this.service.getByIdDetails(
      req.params.id,
    );
    return res
      .status(200)
      .json(HistoryResponseDto.fromDetails(history, player));
  }

  async getByPlayerId(req, res) {
    const histories = await this.service.getByPlayerId(req.params.playerId);
    return res.status(200).json(HistoryResponseDto.fromDocumentList(histories));
  }

  async create(req, res) {
    const history = await this.service.create(req.body);
    return res.status(201).json(HistoryResponseDto.fromDocument(history));
  }

  async delete(req, res) {
    await this.service.deleteById(req.params.id);
    return res.status(204).json();
  }
}
