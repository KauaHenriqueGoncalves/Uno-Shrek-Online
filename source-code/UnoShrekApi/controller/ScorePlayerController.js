import express from "express";

export default class ScorePlayerController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {}

  async getAll(req, res) {}

  async getById(req, res) {}

  async create(req, res) {}

  async update(req, res) {}

  async delete(req, res) {}
}
