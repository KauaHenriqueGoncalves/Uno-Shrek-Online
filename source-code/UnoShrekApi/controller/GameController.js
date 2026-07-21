import express from "express";
import { toGameResponse } from "./../dtos/response/GameResponseDto.js";

export default class GameController {
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
    const games = await this.service.getAll();
    const response = games.map((g) => toGameResponse(g));
    return res.status(200).json(response);
  }

  async getById(req, res) {
    const game = await this.service.getById(req.params.id);
    const response = toGameResponse(game);
    return res.status(200).json(response);
  }

  async create(req, res) {
    const game = await this.service.create(req.body);
    return res.status(201).json(toGameResponse(game));
  }

  async update(req, res) {
    const updatedGame = await this.service.update(req.params.id, req.body);
    const response = toGameResponse(updatedGame);
    return res.status(200).json(response);
  }

  async delete(req, res) {
    await this.service.deleteById(req.params.id);
    return res.status(204).json();
  }
}