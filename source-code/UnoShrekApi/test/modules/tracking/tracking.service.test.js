import TrackingService from "../../../src/modules/tracking/tracking.service.js";

jest.mock("../../../src/modules/tracking/tracking.repository.js", () => {
  return jest.fn().mockImplementation(() => ({
    getAll: jest.fn(),
  }));
});

jest.mock("../../../src/modules/shared/logger/pino-global.logger.js", () => ({
  getInstance: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("TrackingService", () => {
  let service;

  const record = (over = {}) => ({
    endpointAccess: "/api/games",
    requestMethod: "GET",
    statusCode: 200,
    responseTime: 100,
    ...over,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrackingService({});
  });

  describe("getRequestStats", () => {
    it("returns zeroed stats when there are no tracking records", async () => {
      service.trackingRepository.getAll.mockResolvedValue([]);

      const result = await service.getRequestStats();

      expect(result).toEqual({
        totalRequests: 0,
        requestsByMethod: {},
        mostUsedMethod: null,
      });
    });

    it("counts total requests and groups them by method", async () => {
      service.trackingRepository.getAll.mockResolvedValue([
        record({ requestMethod: "GET" }),
        record({ requestMethod: "GET" }),
        record({ requestMethod: "POST" }),
      ]);

      const result = await service.getRequestStats();

      expect(result).toEqual({
        totalRequests: 3,
        requestsByMethod: { GET: 2, POST: 1 },
        mostUsedMethod: "GET",
      });
    });
  });

  describe("getResponseTimeStats", () => {
    it("returns zeroed stats when there are no tracking records", async () => {
      service.trackingRepository.getAll.mockResolvedValue([]);

      const result = await service.getResponseTimeStats();

      expect(result).toEqual({ average: 0, min: 0, max: 0, byEndpoint: [] });
    });

    it("computes average, min, max and per-endpoint averages", async () => {
      service.trackingRepository.getAll.mockResolvedValue([
        record({ endpointAccess: "/api/games", responseTime: 100 }),
        record({ endpointAccess: "/api/games", responseTime: 300 }),
        record({ endpointAccess: "/api/players", responseTime: 50 }),
      ]);

      const result = await service.getResponseTimeStats();

      expect(result.average).toBeCloseTo(150);
      expect(result.min).toBe(50);
      expect(result.max).toBe(300);
      expect(result.byEndpoint).toEqual(
        expect.arrayContaining([
          { endpoint: "/api/games", average: 200 },
          { endpoint: "/api/players", average: 50 },
        ]),
      );
    });
  });

  describe("getStatusCodeStats", () => {
    it("returns zeroed stats when there are no tracking records", async () => {
      service.trackingRepository.getAll.mockResolvedValue([]);

      const result = await service.getStatusCodeStats();

      expect(result).toEqual({
        byStatusCode: {},
        errorRate: 0,
        hasServerErrors: false,
      });
    });

    it("groups by status code and computes error rate and server error flag", async () => {
      service.trackingRepository.getAll.mockResolvedValue([
        record({ statusCode: 200 }),
        record({ statusCode: 200 }),
        record({ statusCode: 404 }),
        record({ statusCode: 500 }),
      ]);

      const result = await service.getStatusCodeStats();

      expect(result.byStatusCode).toEqual({ 200: 2, 404: 1, 500: 1 });
      expect(result.errorRate).toBeCloseTo(0.5);
      expect(result.hasServerErrors).toBe(true);
    });

    it("reports no server errors when only client errors happened", async () => {
      service.trackingRepository.getAll.mockResolvedValue([
        record({ statusCode: 200 }),
        record({ statusCode: 404 }),
      ]);

      const result = await service.getStatusCodeStats();

      expect(result.hasServerErrors).toBe(false);
    });
  });

  describe("getPopularEndpoints", () => {
    it("returns an empty list when there are no tracking records", async () => {
      service.trackingRepository.getAll.mockResolvedValue([]);

      const result = await service.getPopularEndpoints();

      expect(result).toEqual([]);
    });

    it("ranks endpoints by access count, descending", async () => {
      service.trackingRepository.getAll.mockResolvedValue([
        record({ endpointAccess: "/api/games" }),
        record({ endpointAccess: "/api/games" }),
        record({ endpointAccess: "/api/games" }),
        record({ endpointAccess: "/api/players" }),
        record({ endpointAccess: "/api/players" }),
        record({ endpointAccess: "/api/friends" }),
      ]);

      const result = await service.getPopularEndpoints();

      expect(result).toEqual([
        { endpoint: "/api/games", count: 3 },
        { endpoint: "/api/players", count: 2 },
        { endpoint: "/api/friends", count: 1 },
      ]);
    });

    it("returns at most 10 endpoints", async () => {
      const records = Array.from({ length: 12 }, (_, i) =>
        record({ endpointAccess: `/api/endpoint-${i}` }),
      );
      service.trackingRepository.getAll.mockResolvedValue(records);

      const result = await service.getPopularEndpoints();

      expect(result).toHaveLength(10);
    });
  });
});
