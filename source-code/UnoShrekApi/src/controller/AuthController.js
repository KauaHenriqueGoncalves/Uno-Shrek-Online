import { Router } from "express";

export default class AuthController {
  constructor(service) {
    this.service = service;
    this.routers = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.post("/login", this.login.bind(this));
  }

  async login(req, res) {
    const token = await this.service.login(req.body);
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Login successful" });
  }
}
