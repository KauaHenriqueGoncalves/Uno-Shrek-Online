import { Router } from "express";
import PinoGlobal from "../config/logger/PinoGlobal.js";
import { BusinessError } from "../config/exceptions/BusinessError.js";

export default class AuthController {
  constructor(authService, playerService) {
    this.service = authService;
    this.playerService = playerService;
    this.routers = Router();
    this.log = PinoGlobal.getInstance();
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.post("/login", this.login.bind(this));
    this.routers.post("/register", this.register.bind(this));
    this.routers.post("/logout", this.logout.bind(this));
  }

  async login(req, res) {
    const token = await this.service.login(req.body);
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.PROFILE === "prod",
      sameSite: process.env.PROFILE === "prod" ? "strict" : "none",
    });
    // return token in body to aid clients (still set as httpOnly cookie)
    res.status(200).json({ access_token: token });
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

  async register(req, res) {
    try {
      await this.playerService.create(req.body);
      return res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      if (err instanceof BusinessError) {
        return res.status(400).json({ error: "The user already exists; please try again with different input." });
      }
      throw err;
    }
  }
}
