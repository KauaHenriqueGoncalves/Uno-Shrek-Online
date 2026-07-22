import { Router } from "express";
 
export default class CardController {
  constructor(cardService) {
    this.cardService = cardService;
    this.routers = Router();
    this.registerRoutes();
  }
 
  registerRoutes() {
    this.routers.get("/", this.getAll.bind(this));
    this.routers.get("/:id", this.getById.bind(this));
    this.routers.post("/", this.create.bind(this));
    this.routers.put("/:id", this.update.bind(this));
    this.routers.delete("/:id", this.deleteById.bind(this));
  }
 
  async getAll(req, res, next) {
    try {
      const cards = await this.cardService.getAll();
      res.status(200).json(cards);
    } catch (error) {
      next(error);
    }
  }
 
  async getById(req, res, next) {
    try {
      const card = await this.cardService.getById(req.params.id);
      res.status(200).json(card);
    } catch (error) {
      next(error);
    }
  }
 
  async create(req, res, next) {
    try {
      const card = await this.cardService.create(req.body);
      res.status(201).json(card);
    } catch (error) {
      next(error);
    }
  }
 
  async update(req, res, next) {
    try {
      const card = await this.cardService.update(req.params.id, req.body);
      res.status(200).json(card);
    } catch (error) {
      next(error);
    }
  }
 
  async deleteById(req, res, next) {
    try {
      await this.cardService.deleteById(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
 