import JwtCoder from "../../config/jwt/JwtCoder.js";
import PinoGlobal from "../../config/logger/PinoGlobal.js";
import { UnauthorizedError } from "../../config/exceptions/UnauthorizedError.js";

const log = PinoGlobal.getInstance();
const jwtCoder = JwtCoder.getInstance();

export default function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.headers.accesstoken;
    if (!token) {
      log.warn(`Player dont have token. [socketId=${socket.id}]`);
      return next(new UnauthorizedError());
    }
    const tokenDecoded = jwtCoder.decode(token);
    socket.playerId = tokenDecoded.id;
    log.info(`Player connected web socket. [playerId=${tokenDecoded.id}] [socketId=${socket.id}]`);
    next();
  } catch (err) {
    log.warn({ err: err.message }, "socket auth failed");
    next(new Error("unauthorized"));
  }
}
