import bcrypt from "bcryptjs";
import { LoginRequestDto } from "../dtos/request/auth/LoginRequestDto.js";
import { parseOrThrow } from "../config/utils/validate.js";
import { UnauthorizedError } from "../config/exceptions/UnauthorizedError.js";
import JwtCoder from "../config/jwt/JwtCoder.js";
import PinoGlobal from "../config/logger/PinoGlobal.js";

export default class LoginService {
  constructor(playerService) {
    this.playerService = playerService;
    this.jwtCoder = JwtCoder.getInstance();
    this.log = PinoGlobal.getInstance();
  }

  async login(payload) {
    const parsed = parseOrThrow(LoginRequestDto, payload);
    this.log.info(`Getting login with datas. [username=${parsed.username}]`);
    try {
      const player = await this.playerService.getByUsername(parsed.username);
      const passwordMatches = await bcrypt.compare(
        parsed.password,
        player.password,
      );
      if (!passwordMatches) {
        this.log.error("Invalid credentials in login.");
        throw new UnauthorizedError("Invalid credentials");
      }
      return this.jwtCoder.sign(player._id);
    } catch (error) {
      this.log.error("Invalid credentials in login.");
      throw new UnauthorizedError("Invalid credentials");
    }
  }
}
