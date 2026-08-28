import trackingMiddleware from "../../../../src/modules/shared/middleware/tracking.middleware.js";
import TrackingRepository from "../../../../src/modules/tracking/tracking.repository.js";

jest.mock(
  "../../../../src/modules/shared/logger/pino-global.logger.js",
  () => {
    const instance = {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };
    return { __esModule: true, default: { getInstance: () => instance } };
  },
);

jest.mock("../../../../src/modules/tracking/tracking.schema.js", () => ({
  __esModule: true,
  default: {},
}));

jest.mock(
  "../../../../src/modules/tracking/tracking.repository.js",
  () => {
    const instance = { create: jest.fn() };
    return { __esModule: true, default: jest.fn(() => instance) };
  },
);

describe("trackingMiddleware", () => {
  let req, res, next, finishCallback, log, trackingRepository;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

    log =
      require("../../../../src/modules/shared/logger/pino-global.logger.js").default.getInstance();
    log.warn.mockClear();
    trackingRepository = new TrackingRepository();
    trackingRepository.create.mockReset();
    trackingRepository.create.mockResolvedValue(undefined);

    req = {
      method: "GET",
      originalUrl: "/api/players",
      user: { id: "player1" },
    };
    res = {
      statusCode: 200,
      on: jest.fn((event, cb) => {
        if (event === "finish") finishCallback = cb;
      }),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls next immediately without persisting anything yet", () => {
    trackingMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(trackingRepository.create).not.toHaveBeenCalled();
  });

  it("persists the tracking entry with the elapsed time once the response finishes", () => {
    trackingMiddleware(req, res, next);

    jest.advanceTimersByTime(150);
    res.statusCode = 201;
    finishCallback();

    expect(trackingRepository.create).toHaveBeenCalledWith({
      endpointAccess: "/api/players",
      requestMethod: "GET",
      statusCode: 201,
      responseTime: 150,
      userId: "player1",
    });
  });

  it("persists undefined userId when the request has no authenticated user", () => {
    req.user = undefined;

    trackingMiddleware(req, res, next);
    finishCallback();

    expect(trackingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined }),
    );
  });

  it("logs a warning and does not throw when persisting the tracking entry fails", async () => {
    const error = new Error("db down");
    trackingRepository.create.mockRejectedValueOnce(error);

    trackingMiddleware(req, res, next);
    finishCallback();

    await Promise.resolve();
    await Promise.resolve();

    expect(log.warn).toHaveBeenCalledWith(
      { err: error },
      "Failed to persist API tracking entry",
    );
  });
});
