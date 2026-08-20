import PinoGlobal from "../logger/pino-global.logger.js";
import LruCache from "../cache/lru-cache.js";

const log = PinoGlobal.getInstance();
const cache = new LruCache({ max: 50, maxAge: 30000 });

export default function cacheMiddleware(req, res, next) {
  if (req.method !== "GET") return next();
  const userId = req.user?.id ?? "stranger";
  const key = `${userId}-${req.method}-${req.originalUrl}`;
  const cached = cache.get(key);
  if (cached) {
    log.info(`cache find. [key=${key}]`);
    return res.status(cached.status).json(cached.body);
  }
  log.debug({ key }, "[cache] miss");
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) {
      cache.set(key, { status: res.statusCode, body });
    }
    return originalJson(body);
  };
  next();
}
