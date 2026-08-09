import PinoGlobal from "../logger/pino-global.logger.js";
import { AppError } from "../errors/base/app.error.js";

export default function errorHandler(err, req, res, next) {
  const log = PinoGlobal.getInstance();
  if (err instanceof AppError) {
    log.warn(err.message, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
  log.error({ err }, "Unhandled error");
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
}
