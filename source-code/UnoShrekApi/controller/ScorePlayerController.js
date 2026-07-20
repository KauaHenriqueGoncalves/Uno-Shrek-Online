import express from "express";
import { toScorePlayerResponse } from "./../dtos/response/ScorePlayerResponseDto.js";

export default class ScorePlayerController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", this.getAll.bind(this));
    this.routers.get("/:id", this.getById.bind(this));
    this.routers.post("/", this.create.bind(this));
    this.routers.put("/:id", this.update.bind(this));
    this.routers.delete("/:id", this.delete.bind(this));
  }

  async getAll(req, res) {
    const scores = await this.service.getAll();
    const response = scores.map((s) => toScorePlayerResponse(s));
    return res.status(200).json(response);
  }

  async getById(req, res) {
    const score = await this.service.getById(req.params.id);
    const response = toScorePlayerResponse(score);
    return res.status(200).json(response);
  }

  async create(req, res) {
    const score = await this.service.create(req.body);
    return res.status(201).json(toScorePlayerResponse(score));
  }

  async update(req, res) {
    const updatedScore = await this.service.update(req.params.id, req.body);
    const response = toScorePlayerResponse(updatedScore);
    return res.status(200).json(response);
  }

  async delete(req, res) {
    await this.service.deleteById(req.params.id);
    return res.status(204).json();
  }
}
