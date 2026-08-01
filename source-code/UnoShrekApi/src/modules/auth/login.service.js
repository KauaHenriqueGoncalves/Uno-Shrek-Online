import bcrypt from "bcryptjs";
import { LoginRequestDto } from "./dto/login.request.dto.js";
import { parseOrThrow } from "../shared/utils/validate.js";
import { UnauthorizedError } from "../shared/errors/unauthorized.error.js";
import JwtCoder from "../shared/jwt/jwt-coder.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";

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
