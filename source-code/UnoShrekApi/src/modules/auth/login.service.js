import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { LoginRequestDto } from "./dto/login.request.dto.js";
import { parseOrThrow } from "../shared/utils/validate.js";
import { UnauthorizedError } from "../shared/errors/unauthorized.error.js";
import JwtCoder from "../shared/jwt/jwt-coder.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  async googleAuth(accessToken) {
    this.log.info("Starting Google authentication");

    let googleUser;
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch Google user info");
      googleUser = await response.json();
    } catch (err) {
      this.log.warn({ err }, "Google token verification failed");
      throw new UnauthorizedError("Invalid Google token");
  }

    const { sub: googleId, email, name, picture } = googleUser;
    this.log.info(`Google auth payload received. [email=${email}]`);

    let player = await this.playerService.getByGoogleId(googleId);

    if (!player) {
      player = await this.playerService.getByEmailSafe(email);
      if (player) {
        
        this.log.info(`Linking Google to existing account. [email=${email}]`);
        player = await this.playerService.linkGoogle(player._id, googleId, picture);

      } else {
        this.log.info(`Creating new account from Google. [email=${email}]`);
        player = await this.playerService.createFromGoogle({ username: name, email, googleId, picture });
    }
  }

    this.log.info(`Google auth success. [playerId=${player._id.toString()}]`);
    return this.jwtCoder.sign(player._id);
  }
}