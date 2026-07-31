import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../exceptions/UnauthorizedError.js";

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
