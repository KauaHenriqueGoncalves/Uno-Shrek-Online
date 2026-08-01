import JwtCoder from "../jwt/JwtCoder.js";
import PinoGlobal from "../logger/PinoGlobal.js";
import { UnauthorizedError } from "../../config/exceptions/UnauthorizedError.js";
import BlacklistedToken from "../token/BlacklistedToken.js";
import BlacklistedTokenRepository from "../../repository/BlacklistedTokenRepository.js";

const log = PinoGlobal.getInstance();
const jwtCoder = JwtCoder.getInstance();
const blacklistedRepo = new BlacklistedTokenRepository(BlacklistedToken);
export default async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.headers.accesstoken;
    if (!token) {
      log.warn(`Player dont have token. [socketId=${socket.id}]`);
      return next(new UnauthorizedError());
    }
    const isBlacklisted = await blacklistedRepo.existsByToken(token);
    if (isBlacklisted) {
      log.warn(`Player token is blacklisted. [socketId=${socket.id}]`);
      return next(new UnauthorizedError());
    }
    const tokenDecoded = jwtCoder.decode(token);
    socket.token = token;
    socket.playerId = tokenDecoded.id;
    log.info(`Player didnt have problem with conection on socket. [socketId=${socket.id}]`);
    next();
  } catch (err) {
    log.warn({ err: err.message }, "socket auth failed");
    next(new Error("unauthorized"));
  }
}
