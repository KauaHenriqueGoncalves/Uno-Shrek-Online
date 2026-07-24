import { Router } from "express";
import PinoGlobal from "../config/logger/PinoGlobal.js";

export default class AuthController {
  constructor(service) {
    this.service = service;
    this.routers = Router();
    this.log = PinoGlobal.getInstance();
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.post("/login", this.login.bind(this));
    this.routers.post("/logout", this.logout.bind(this));
  }

  async login(req, res) {
    const token = await this.service.login(req.body);
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.PROFILE === "prod",
      sameSite: process.env.PROFILE === "prod" ? "strict" : "none",
    });
    res.status(200).json({ message: "Login successful" });
  }

  async logout(req, res) {
    this.log.info("Removing token with logout");
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.PROFILE === "prod",
      sameSite: process.env.PROFILE === "prod" ? "strict" : "none",
    });
    res.status(200).json({ message: "Logout successful" });
  }
}
