import express from "express";
import GameResponseDto from "./response/game.response.dto.js";
import authMiddleware from "../shared/middleware/auth.middleware.js";
import asyncHandler from "../shared/utils/async-handler.js";

export default class GameController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", authMiddleware, asyncHandler(this.getAll.bind(this)));
    this.routers.get(
      "/status/:status",
      authMiddleware,
      asyncHandler(this.getAllByStatus.bind(this)),
    );
    this.routers.post(
      "/",
      authMiddleware,
      asyncHandler(this.create.bind(this)),
    );
    this.routers.put(
      "/join",
      authMiddleware,
      asyncHandler(this.joinInGame.bind(this)),
    );
    this.routers.put(
      "/leave",
      authMiddleware,
      asyncHandler(this.leaveGame.bind(this)),
    );
    this.routers.put(
      "/ready",
      authMiddleware,
      asyncHandler(this.readyInGame.bind(this)),
    );
    this.routers.put(
      "/not-ready",
      authMiddleware,
      asyncHandler(this.notReadyInGame.bind(this)),
    );
    this.routers.put(
      "/start",
      authMiddleware,
      asyncHandler(this.startGame.bind(this)),
    );
    this.routers.put(
      "/finish",
      authMiddleware,
      asyncHandler(this.finishedGame.bind(this)),
    );
    this.routers.get(
      "/:id/status",
      authMiddleware,
      asyncHandler(this.getStatusById.bind(this)),
    );
    this.routers.get(
      "/:id/current-score",
      authMiddleware,
      asyncHandler(this.getCurrentScoreById.bind(this)),
    );
    this.routers.get(
      "/:id",
      authMiddleware,
      asyncHandler(this.getById.bind(this)),
    );
    this.routers.get(
      "/:id/current-players",
      authMiddleware,
      asyncHandler(this.getCurrentPlayersById.bind(this)),
    );
    this.routers.get(
      "/:id/current-player",
      authMiddleware,
      asyncHandler(this.getCurrentPlayerById.bind(this)),
    );
    this.routers.get(
      "/:id/top-card",
      authMiddleware,
      asyncHandler(this.getTopCardById.bind(this)),
    );
    this.routers.put(
      "/:id/draw",
      authMiddleware,
      asyncHandler(this.draw.bind(this)),
    );
    this.routers.put(
      "/:id/play",
      authMiddleware,
      asyncHandler(this.play.bind(this)),
    );
    this.routers.put(
      "/:id/score",
      authMiddleware,
      asyncHandler(this.updatePlayerScore.bind(this)),
    );
    this.routers.put(
      "/:id",
      authMiddleware,
      asyncHandler(this.update.bind(this)),
    );
    this.routers.delete(
      "/:id",
      authMiddleware,
      asyncHandler(this.delete.bind(this)),
    );
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
    const { game } = await this.service.getByIdInfo(req.params.id);
    const response = GameResponseDto.fromDocumentRoom(game);
    return res.status(200).json(response);
  }

  async getStatusById(req, res) {
    const game = await this.service.getById(req.params.id);
    const response = GameResponseDto.fromDocumentStatus(game);
    return res.status(200).json(response);
  }

  async getCurrentPlayersById(req, res) {
    const { game } = await this.service.getByIdInfo(req.params.id);
    const response = GameResponseDto.fromDocumentCurrentPlayers(game);
    return res.status(200).json(response);
  }

  async getCurrentPlayerById(req, res) {
    const { game } = await this.service.getByIdInfo(req.params.id);
    const response = GameResponseDto.fromDocumentCurrentPlayer(game);
    return res.status(200).json(response);
  }

  async getTopCardById(req, res) {
    const { game } = await this.service.getByIdInfo(req.params.id);
    const response = GameResponseDto.fromDocumentTopCard(game);
    return res.status(200).json(response);
  }

  async getCurrentScoreById(req, res) {
    const { game } = await this.service.getByIdInfo(req.params.id);
    const response = GameResponseDto.fromDocumentCurrentScore(game);
    return res.status(200).json(response);
  }

  async create(req, res) {
    const userId = req.user && req.user.id;
    const game = await this.service.create(userId, req.body);
    const response = { message: "Game created successfully", gameId: game._id };
    return res.status(201).json(response);
  }

  async joinInGame(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.body.gameId;
    const game = await this.service.joinInGame(userId, gameId);
    const response = { message: "User joined the game successfully" };
    return res.status(200).json(response);
  }

  async leaveGame(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.body.gameId;
    const game = await this.service.leaveGame(userId, gameId);
    const response = { message: "User leave the game successfully" };
    return res.status(200).json(response);
  }

  async readyInGame(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.body.gameId;
    const game = await this.service.readyInGame(userId, gameId);
    const response = { message: "Player is ready" };
    return res.status(200).json(response);
  }

  async notReadyInGame(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.body.gameId;
    const game = await this.service.notReadyInGame(userId, gameId);
    const response = { message: "Player is not ready" };
    return res.status(200).json(response);
  }

  async updatePlayerScore(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.params.id;
    const score = req.body.score;
    const updatedGame = await this.service.updatePlayerScore(
      userId,
      gameId,
      score,
    );
    return res
      .status(200)
      .json({ message: "Player score updated", gameId: updatedGame._id });
  }

  async startGame(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.body.gameId;
    const game = await this.service.startGame(userId, gameId);
    const response = { message: "Game started successfully" };
    return res.status(200).json(response);
  }

  async draw(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.params.id;
    const game = await this.service.draw(userId, gameId);
    return res.status(200).json({ message: "Drew a card", gameId: game._id });
  }

  async play(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.params.id;
    const playedCard = req.body.card;
    const colorChoice = req.body.colorChoice || null;
    const game = await this.service.play(
      userId,
      gameId,
      playedCard,
      colorChoice,
    );
    return res.status(200).json({ message: "Card played", gameId: game._id });
  }

  async finishedGame(req, res) {
    const userId = req.user && req.user.id;
    const gameId = req.body.gameId;
    const game = await this.service.finishedGame(userId, gameId);
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
