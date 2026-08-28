import PinoGlobal from "../logger/pino-global.logger.js";
import Tracking from "../../tracking/tracking.schema.js";
import TrackingRepository from "../../tracking/tracking.repository.js";

const log = PinoGlobal.getInstance();
const trackingRepository = new TrackingRepository(Tracking);

export default function trackingMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    trackingRepository
      .create({
        endpointAccess: req.originalUrl,
        requestMethod: req.method,
        statusCode: res.statusCode,
        responseTime,
        userId: req.user?.id,
      })
      .catch((err) => {
        log.warn({ err }, "Failed to persist API tracking entry");
      });
  });
  next();
}
