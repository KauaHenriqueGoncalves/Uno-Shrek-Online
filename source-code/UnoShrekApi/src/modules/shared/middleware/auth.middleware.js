import { UnauthorizedError } from "../errors/unauthorized.error.js";
import JwtCoder from "../jwt/jwt-coder.js";
import PinoGlobal from "../logger/pino-global.logger.js";
import BlacklistedToken from "../token/blacklisted-token.schema.js";
import BlacklistedTokenRepository from "../token/blacklisted-token.repository.js";

const jwtCoder = JwtCoder.getInstance();
const log = PinoGlobal.getInstance();
const blacklistedRepo = new BlacklistedTokenRepository(BlacklistedToken);

export default async function authMiddleware(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) {
    log.warn("Getting request without token");
    return next(new UnauthorizedError("Dont have token"));
  }
  try {
    const isBlacklisted = await blacklistedRepo.existsByToken(token);
    if (isBlacklisted) {
      log.warn("Token is blacklisted");
      return next(new UnauthorizedError("Token revoked"));
    }
  } catch (err) {
    log.error({ err }, "Error checking token blacklist");
    return next(new UnauthorizedError("Unauthorized"));
  }
  try {
    req.user = jwtCoder.decode(token);
    next();
  } catch (err) {
    next(err);
  }
}
