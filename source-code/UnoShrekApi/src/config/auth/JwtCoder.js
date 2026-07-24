import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../exceptions/UnauthorizedError.js";

export default class JwtCoder {
  constructor() {
    this.jwtCoder = jwt;
    this.jwtSecret = process.env.JWT_SECRET;
  }

  sign(userId) {
    return this.jwtCoder.sign({ id: userId }, this.jwtSecret);
  }

  decode(token) {
    try {
      return this.jwtCoder.verify(token, this.jwtSecret);
    } catch (err) {
      throw new UnauthorizedError("Token inválido");
    }
  }
}
