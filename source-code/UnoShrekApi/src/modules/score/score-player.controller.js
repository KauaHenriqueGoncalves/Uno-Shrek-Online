import express from "express";
import ScorePlayerResponseDto from "./response/score-player.response.dto.js";
import asyncHandler from "../shared/utils/async-handler.js";

export default class ScorePlayerController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", asyncHandler(this.getAll.bind(this)));
    this.routers.get("/:id", asyncHandler(this.getById.bind(this)));
    this.routers.get("/:id/details", asyncHandler(this.getByIdDetails.bind(this)));
    this.routers.post("/", asyncHandler(this.create.bind(this)));
    this.routers.put("/:id", asyncHandler(this.update.bind(this)));
    this.routers.delete("/:id", asyncHandler(this.delete.bind(this)));
  }

  async getAll(req, res) {
    const scores = await this.service.getAll();
    const response = ScorePlayerResponseDto.fromDocumentList(scores);
    return res.status(200).json(response);
  }

  async getById(req, res) {
    const score = await this.service.getById(req.params.id);
    const response = ScorePlayerResponseDto.fromDocument(score);
    return res.status(200).json(response);
  }

  async getByIdDetails(req, res) {
    const { score, player, game } = await this.service.getByIdDetails(
      req.params.id,
    );
    const response = ScorePlayerResponseDto.fromDetails(score, player, game);
    return res.status(200).json(response);
  }

  async create(req, res) {
    const score = await this.service.create(req.body);
    const response = ScorePlayerResponseDto.fromDocument(score);
    return res.status(201).json(response);
  }

  async update(req, res) {
    const updatedScore = await this.service.update(req.params.id, req.body);
    const response = ScorePlayerResponseDto.fromDocument(updatedScore);
    return res.status(200).json(response);
  }

  async delete(req, res) {
    await this.service.deleteById(req.params.id);
    return res.status(204).json();
  }
}
