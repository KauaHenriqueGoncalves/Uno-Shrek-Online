import PinoGlobal from "../logger/PinoGlobal.js";
import { AppError } from "../exceptions/AppError.js";

export default function errorHandler(err, req, res, next) {
  const log = PinoGlobal.getInstance();

  // erro mapped
  if (err instanceof AppError) {
    log.warn(err.message, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // erro not mapped
  log.error({ err }, "Unhandled error");
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
}
