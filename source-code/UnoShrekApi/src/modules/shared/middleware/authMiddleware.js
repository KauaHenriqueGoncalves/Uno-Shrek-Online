import { UnauthorizedError } from "./../exceptions/UnauthorizedError.js";
import JwtCoder from "../jwt/JwtCoder.js";
import PinoGLobal from "../logger/PinoGlobal.js";
import BlacklistedToken from "../token/BlacklistedToken.js";
import BlacklistedTokenRepository from "../../repository/BlacklistedTokenRepository.js";

const jwtCoder = JwtCoder.getInstance();
const log = PinoGLobal.getInstance();
const blacklistedRepo = new BlacklistedTokenRepository(BlacklistedToken);

export default async function authMiddleware(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) {
    log.warn("Getting request without token");
    return next(new UnauthorizedError("Dont have token"));
  }
  // check blacklist
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
