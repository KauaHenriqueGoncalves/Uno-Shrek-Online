import express from "express";
import GameResponseDto from "./../dtos/response/GameResponseDto.js";
import authMiddleware from "../config/middleware/authMiddleware.js";
import asyncHandler from "../config/utils/asyncHandler.js";

export default class GameController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", authMiddleware, asyncHandler(this.getAll.bind(this)));
    this.routers.get("/status/:status", authMiddleware, asyncHandler(this.getAllByStatus.bind(this)));
    this.routers.post("/", authMiddleware, asyncHandler(this.create.bind(this)));
    this.routers.put("/join", authMiddleware, asyncHandler(this.joinInGame.bind(this)));
    this.routers.put("/leave", authMiddleware, asyncHandler(this.leaveGame.bind(this)));
    this.routers.put("/ready", authMiddleware, asyncHandler(this.readyInGame.bind(this)));
    this.routers.put("/not-ready", authMiddleware, asyncHandler(this.notReadyInGame.bind(this)));
    this.routers.put("/start", authMiddleware, asyncHandler(this.startGame.bind(this)));
    this.routers.put("/finish", authMiddleware, asyncHandler(this.finishedGame.bind(this)));
    this.routers.get("/:id/status", authMiddleware, asyncHandler(this.getStatusById.bind(this)));
    this.routers.get("/:id/current-score", authMiddleware, asyncHandler(this.getCurrentScoreById.bind(this)));
    this.routers.get("/:id", authMiddleware, asyncHandler(this.getById.bind(this)));
    this.routers.get("/:id/current-players", authMiddleware, asyncHandler(this.getCurrentPlayersById.bind(this)));
    this.routers.get("/:id/current-player", authMiddleware, asyncHandler(this.getCurrentPlayerById.bind(this)));
    this.routers.get("/:id/top-card", authMiddleware, asyncHandler(this.getTopCardById.bind(this)));
    this.routers.put("/:id", authMiddleware, asyncHandler(this.update.bind(this)));
    this.routers.delete("/:id", authMiddleware, asyncHandler(this.delete.bind(this)));
  }

  async getAll(req, res) {
    const games = await this.service.getAll();
    const response = GameResponseDto.fromDocumentList(games);
    return res.status(200).json(response);
  }

  async getAllByStatus(req, res) {
    const status = req.params.status;
    const games = await this.service.getAllByStatus(status);
    const response = GameResponseDto.fromDocumentList(games);
    return res.status(200).json(response);
  }

  async getById(req, res) {
    const { game, players } = await this.service.getByIdInfo(req.params.id);
    const response = GameResponseDto.fromDocumentRoom(game, players);
    return res.status(200).json(response);
  }

  async getStatusById(req, res) {
    const game = await this.service.getById(req.params.id);
    const response = GameResponseDto.fromDocumentStatus(game);
    return res.status(200).json(response);
  }

  async getCurrentPlayersById(req, res) {
    const { game, players } = await this.service.getCurrentPlayersById(req.params.id);
    const response = GameResponseDto.fromDocumentCurrentPlayer(game, players);
    return res.status(200).json(response);
  }

  async getCurrentPlayerById(req, res) {
    const { game, player } = await this.service.getCurrentPlayerById(req.params.id);
    return res.status(200).json({ game_id: game._id.toString(), current_player: player.username });
  }

  async getTopCardById(req, res) {
    const { game, topCard } = await this.service.getTopCardById(req.params.id);
    return res.status(200).json({ game_id: game._id.toString(), top_card: topCard });
  }

  async getCurrentScoreById(req, res) {
    const { game, scores } = await this.service.getCurrentScoreById(req.params.id);
    const response = GameResponseDto.fromDocumentCurrentScore(game, scores);
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

  async leaveGame(req, res) {
    const token = req.cookies.accessToken;
    const gameId = req.body.gameId;
    const game = await this.service.leaveGame(token, gameId);
    const response = { message: "User leave the game successfully" };
    return res.status(200).json(response);
  }

  async readyInGame(req, res) {
    const token = req.cookies.accessToken;
    const gameId = req.body.gameId;
    const game = await this.service.readyInGame(token, gameId);
    const response = { message: "Player is ready" };
    return res.status(200).json(response);
  }

  async notReadyInGame(req, res) {
    const token = req.cookies.accessToken;
    const gameId = req.body.gameId;
    const game = await this.service.notReadyInGame(token, gameId);
    const response = { message: "Player is not ready" };
    return res.status(200).json(response);
  }

  async startGame(req, res) {
    const token = req.cookies.accessToken;
    const gameId = req.body.gameId;
    const game = await this.service.startGame(token, gameId);
    const response = { message: "Game started successfully" };
    return res.status(200).json(response);
  }

  async finishedGame(req, res) {
    const token = req.cookies.accessToken;
    const gameId = req.body.gameId;
    const game = await this.service.finishedGame(token, gameId);
    const response = { message: "Game ended successfully" };
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
