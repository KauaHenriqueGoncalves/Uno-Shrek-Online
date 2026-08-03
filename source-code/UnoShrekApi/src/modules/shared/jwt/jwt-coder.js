import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/unauthorized.error.js";

export default class JwtCoder {
  static instance = null;

  static getInstance() {
    if (this.instance == null) {
      this.instance = new JwtCoder();
    }
    return this.instance;
  }

  constructor() {
    this.jwtCoder = jwt;
    this.jwtSecret = process.env.JWT_SECRET;
    if (!this.jwtSecret) {
      throw new Error(
        "JWT_SECRET is not defined. Set JWT_SECRET in environment variables or .env",
      );
    }
  }

  sign(userId) {
    return this.jwtCoder.sign({ id: userId }, this.jwtSecret, {
      expiresIn: "72h",
    });
  }

  decode(token) {
    try {
      return this.jwtCoder.verify(token, this.jwtSecret);
    } catch (err) {
      throw new UnauthorizedError("Token inválido");
    }
  }
}
