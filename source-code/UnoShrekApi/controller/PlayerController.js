import express from "express";
import { toPlayerResponse } from "./../dtos/response/PlayerResponseDto.js";

export default class PlayerController {
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
    const players = await this.service.getAll();
    const response = players.map((p) => toPlayerResponse(p));
    return res.status(200).json(response);
  }

  async getById(req, res) {
    const player = await this.service.getById(req.params.id);
    const response = toPlayerResponse(player);
    return res.status(200).json(response);
  }

  async create(req, res) {
    const player = await this.service.create(req.body);
    return res.status(201).json(toPlayerResponse(player));
  }

  async update(req, res) {
    const updatePlayer = await this.service.update(req.params.id, req.body);
    const response = toPlayerResponse(updatePlayer);
    return res.status(200).json(response);
  }

  async delete(req, res) {
    await this.service.deleteById(req.params.id);
    return res.status(204).json();
  }
}
