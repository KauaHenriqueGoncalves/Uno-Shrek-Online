import express from "express";
import GameResponseDto from "./../dtos/response/GameResponseDto.js";
import authMiddleware from "../config/middleware/authMiddleware.js";

export default class GameController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", this.getAll.bind(this));
    this.routers.get("/:id", this.getById.bind(this));
    this.routers.post("/", authMiddleware, this.create.bind(this));
    this.routers.put("/join", authMiddleware, this.joinInGame.bind(this));
    this.routers.put("/:id", authMiddleware, this.update.bind(this));
    this.routers.delete("/:id", authMiddleware, this.delete.bind(this));
  }

  async getAll(req, res) {
    const games = await this.service.getAll();
    const response = GameResponseDto.fromDocumentList(games);
    return res.status(200).json(response);
  }

  async getById(req, res) {
    const game = await this.service.getById(req.params.id);
    const response = GameResponseDto.fromDocument(game);
    return res.status(200).json(response);
  }

  async create(req, res) {
    const token = req.cookies.accessToken;
    const game = await this.service.create(token, req.body);
    const response = { message: "Game created successfully", gameId: game._id };
    return res.status(201).json(response);
  }

  async joinInGame(req, res) {
    const token = req.cookies.accessToken;
    const gameId = req.body.gameId;
    const game = await this.service.joinInGame(token, gameId);
    const response = { message: "User joined the game successfully" };
    return res.status(200).json(response);
  }

  async update(req, res) {
    const updatedGame = await this.service.update(req.params.id, req.body);
    const response = GameResponseDto.fromDocument(updatedGame);
    return res.status(200).json(response);
  }

  async delete(req, res) {
    await this.service.deleteById(req.params.id);
    return res.status(204).json();
  }
}
