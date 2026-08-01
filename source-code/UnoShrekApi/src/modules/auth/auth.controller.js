import { Router } from "express";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { BusinessError } from "../shared/errors/business.error.js";
import asyncHandler from "../shared/utils/async-handler.js";
import JwtCoder from "../shared/jwt/jwt-coder.js";

export default class AuthController {
  constructor(authService, playerService, tokenService) {
    this.service = authService;
    this.playerService = playerService;
    this.tokenService = tokenService;
    this.routers = Router();
    this.jwtCoder = JwtCoder.getInstance();
    this.log = PinoGlobal.getInstance();
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.post("/login", asyncHandler(this.login.bind(this)));
    this.routers.post("/register", asyncHandler(this.register.bind(this)));
    this.routers.post("/logout", asyncHandler(this.logout.bind(this)));
  }

  async login(req, res) {
    const token = await this.service.login(req.body);
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.PROFILE === "prod",
      sameSite: process.env.PROFILE === "prod" ? "strict" : "none",
    });
    res.status(200).json({ access_token: token });
  }

  async logout(req, res) {
    this.log.info("Removing token with logout");
    const token = req.cookies.accessToken || req.body?.access_token;
    if (!token) {
      return res
        .status(400)
        .json({ error: "access_token is required to logout" });
    }
    if (token && this.tokenService) {
      try {
        const decoded = this.jwtCoder.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenService.blacklistToken(token, expiresAt);
      } catch (err) {
        this.log.warn({ err }, "Token decode failed during logout");
        return res.status(400).json({ error: "Invalid token" });
      }
    }
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
        return res.status(400).json({
          error:
            "The user already exists; please try again with different input.",
        });
      }
      throw err;
    }
  }
}
