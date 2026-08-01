import express from "express";
import PlayerResponseDto from "./response/PlayerResponseDto.js";
import authMiddleware from "../shared/middleware/authMiddleware.js";
import asyncHandler from "../shared/utils/asyncHandler.js";

export default class PlayerController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", authMiddleware, asyncHandler(this.getAll.bind(this)));
    this.routers.get("/me", authMiddleware, asyncHandler(this.getByMe.bind(this)));
    this.routers.post("/", authMiddleware, asyncHandler(this.create.bind(this)));
    this.routers.get("/:id", authMiddleware, asyncHandler(this.getById.bind(this)));
    this.routers.put("/:id", authMiddleware, asyncHandler(this.update.bind(this)));
    this.routers.delete("/:id", authMiddleware, asyncHandler(this.delete.bind(this)));
  }

  async getAll(req, res) {
    const players = await this.service.getAll();
    const response = PlayerResponseDto.fromDocumentViewSimpleList(players);
    return res.status(200).json(response);
  }

  async getByMe(req, res) {
    const userId = req.user && req.user.id;
    const player = await this.service.getById(userId);
    const response = PlayerResponseDto.fromDocument(player);
    return res.status(200).json(response);
  }

  async getById(req, res) {
    const player = await this.service.getById(req.params.id);
    const response = PlayerResponseDto.fromDocument(player);
    return res.status(200).json(response);
  }

  async create(req, res) {
    const player = await this.service.create(req.body);
    const response = PlayerResponseDto.fromDocument(player);
    return res.status(201).json(response);
  }

  async update(req, res) {
    const updatePlayer = await this.service.update(req.params.id, req.body);
    const response = PlayerResponseDto.fromDocument(updatePlayer);
    return res.status(200).json(response);
  }

  async delete(req, res) {
    await this.service.deleteById(req.params.id);
    return res.status(204).json();
  }
}
