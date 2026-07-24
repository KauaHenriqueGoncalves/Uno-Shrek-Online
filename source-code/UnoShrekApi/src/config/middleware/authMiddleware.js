import { UnauthorizedError } from "./../exceptions/UnauthorizedError.js";
import JwtCoder from "../jwt/JwtCoder.js";
import PinoGLobal from "../logger/PinoGlobal.js";

const jwtCoder = JwtCoder.getInstance();
const log = PinoGLobal.getInstance();

export default function authMiddleware(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    log.warn("Getting request without token");
    return next(new UnauthorizedError("Dont have token"));
  }

  try {
    req.user = jwtCoder.decode(token);
    next();
  } catch (err) {
    next(err);
  }
}
