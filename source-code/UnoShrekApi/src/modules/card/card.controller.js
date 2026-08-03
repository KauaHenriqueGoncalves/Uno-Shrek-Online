import { Router } from "express";
import CardResponseDto from "./response/card.response.dto.js";
import asyncHandler from "../shared/utils/async-handler.js";

export default class CardController {
  constructor(cardService) {
    this.cardService = cardService;
    this.routers = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get("/", asyncHandler(this.getAll.bind(this)));
    this.routers.get("/:id", asyncHandler(this.getById.bind(this)));
    this.routers.get("/:id/details", asyncHandler(this.getByIdDetails.bind(this)));
    this.routers.post("/", asyncHandler(this.create.bind(this)));
    this.routers.put("/:id", asyncHandler(this.update.bind(this)));
    this.routers.delete("/:id", asyncHandler(this.deleteById.bind(this)));
  }

  async getAll(req, res) {
    const cards = await this.cardService.getAll();
    const response = CardResponseDto.fromDocumentList(cards);
    res.status(200).json(response);
  }

  async getById(req, res) {
    const card = await this.cardService.getById(req.params.id);
    const response = CardResponseDto.fromDocument(card);
    res.status(200).json(response);
  }

  async getByIdDetails(req, res) {
    const { card, game } = await this.cardService.getByIdDetails(req.params.id);
    const response = CardResponseDto.fromDetails(card, game);
    return res.status(200).json(response);
  }

  async create(req, res) {
    const card = await this.cardService.create(req.body);
    const response = CardResponseDto.fromDocument(card);
    res.status(201).json(response);
  }

  async update(req, res) {
    const card = await this.cardService.update(req.params.id, req.body);
    const response = CardResponseDto.fromDocument(card);
    res.status(200).json(response);
  }

  async deleteById(req, res) {
    await this.cardService.deleteById(req.params.id);
    res.status(204).send();
  }
}
