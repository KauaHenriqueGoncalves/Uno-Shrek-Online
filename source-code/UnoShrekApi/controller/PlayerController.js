import express from "express";

export default class PlayerController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/:id", this.getById.bind(this));
    this.routers.post("/", this.create.bind(this));
  }

  async getById(req, res) {
    const player = await this.service.getById(req.params.id);
    return res.status(200).json(player);
  }

  async create(req, res) {
    console.log(req.body);
    const player = await this.service.create(req.body);
    return res.status(201).json(player);
  }
}
