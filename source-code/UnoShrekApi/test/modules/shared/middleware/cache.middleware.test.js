import cacheMiddleware from "../../../../src/modules/shared/middleware/cache.middleware.js";

jest.mock(
  "../../../../src/modules/shared/logger/pino-global.logger.js",
  () => ({
    __esModule: true,
    default: {
      getInstance: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      })),
    },
  }),
);

describe("cacheMiddleware", () => {
  let req, res, next;
  let log;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

    log =
      require("../../../../src/modules/shared/logger/pino-global.logger.js").default.getInstance();
    log.info.mockClear();
    log.debug.mockClear();
    log.warn.mockClear();

    req = {
      method: "GET",
      originalUrl: "/api/players",
      user: { id: "507f1f77bcf86cd799439011" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      statusCode: 200,
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("when method is not GET", () => {
    it("should call next and not interact with cache", () => {
      req.method = "POST";

      cacheMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("when cache hit", () => {
    it("should return cached response and not call next", () => {
      cacheMiddleware(req, res, next);

      const body = { message: "test" };
      res.statusCode = 200;
      res.json(body);

      jest.clearAllMocks();

      const req2 = { ...req };
      const res2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        statusCode: 200,
      };
      const next2 = jest.fn();

      cacheMiddleware(req2, res2, next2);

      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith(body);
      expect(next2).not.toHaveBeenCalled();
    });

    it("should use 'stranger' as userId when req.user is undefined", () => {
      req.user = undefined;

      cacheMiddleware(req, res, next);

      const body = { message: "test" };
      res.json(body);
      const req2 = { ...req, user: undefined };
      const res2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        statusCode: 200,
      };

      cacheMiddleware(req2, res2, next);

      expect(res2.json).toHaveBeenCalledWith(body);
    });
  });

  describe("when cache miss", () => {
    it("should cache response when statusCode < 400", () => {
      cacheMiddleware(req, res, next);

      const body = { data: "test" };
      res.statusCode = 200;
      res.json(body);

      expect(res.json).toHaveBeenCalledWith(body);
    });
  });
});
