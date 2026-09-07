import LruCache from "../../../../src/modules/shared/cache/lru-cache.js";

jest.mock("../../../../src/modules/shared/logger/pino-global.logger.js", () => ({
  getInstance: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("LruCache", () => {
  let lruCache;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("constructor", () => {
    it("should create cache with default values", () => {
      lruCache = new LruCache();

      expect(lruCache.max).toBe(50);
      expect(lruCache.maxAge).toBe(30000);
      expect(lruCache.map).toBeInstanceOf(Map);
      expect(lruCache.map.size).toBe(0);
    });

    it("should create cache with custom values", () => {
      lruCache = new LruCache({ max: 10, maxAge: 5000 });

      expect(lruCache.max).toBe(10);
      expect(lruCache.maxAge).toBe(5000);
    });
  });

  describe("set", () => {
    it("should add item to cache", () => {
      lruCache = new LruCache();

      lruCache.set("key1", "value1");

      expect(lruCache.map.size).toBe(1);
      expect(lruCache.map.get("key1")).toEqual({
        value: "value1",
        expiresAt: Date.now() + 30000,
      });
    });

    it("should update existing item without increasing size", () => {
      lruCache = new LruCache();

      lruCache.set("key1", "value1");
      lruCache.set("key1", "value2");

      expect(lruCache.map.size).toBe(1);
      expect(lruCache.map.get("key1").value).toBe("value2");
    });

    it("should evict oldest item when cache is full", () => {
      lruCache = new LruCache({ max: 2 });

      lruCache.set("key1", "value1");
      lruCache.set("key2", "value2");
      lruCache.set("key3", "value3");

      expect(lruCache.map.size).toBe(2);
      expect(lruCache.map.has("key1")).toBe(false);
      expect(lruCache.map.has("key2")).toBe(true);
      expect(lruCache.map.has("key3")).toBe(true);
    });

    it("should update last access time when setting existing key", () => {
      lruCache = new LruCache({ max: 2 });

      lruCache.set("key1", "value1");
      lruCache.set("key2", "value2");

      // Atualiza key1 para movê-la para o final
      lruCache.set("key1", "updated-value1");

      lruCache.set("key3", "value3");

      expect(lruCache.map.size).toBe(2);
      expect(lruCache.map.has("key1")).toBe(true);
      expect(lruCache.map.has("key2")).toBe(false);
      expect(lruCache.map.has("key3")).toBe(true);
    });
  });

  describe("get", () => {
    it("should return value for existing key", () => {
      lruCache = new LruCache();

      lruCache.set("key1", "value1");

      const result = lruCache.get("key1");

      expect(result).toBe("value1");
    });

    it("should return undefined for non-existent key", () => {
      lruCache = new LruCache();

      const result = lruCache.get("non-existent-key");

      expect(result).toBeUndefined();
    });

    it("should return undefined for expired key and remove it", () => {
      lruCache = new LruCache({ maxAge: 1000 });

      lruCache.set("key1", "value1");

      // Avança o tempo em 2 segundos
      jest.advanceTimersByTime(2000);

      const result = lruCache.get("key1");

      expect(result).toBeUndefined();
      expect(lruCache.map.has("key1")).toBe(false);
    });

    it("should update last access time when getting item", () => {
      lruCache = new LruCache({ max: 2 });

      lruCache.set("key1", "value1");
      lruCache.set("key2", "value2");

      // Acessa key1 para movê-la para o final
      lruCache.get("key1");

      lruCache.set("key3", "value3");

      expect(lruCache.map.size).toBe(2);
      expect(lruCache.map.has("key1")).toBe(true);
      expect(lruCache.map.has("key2")).toBe(false);
      expect(lruCache.map.has("key3")).toBe(true);
    });

    it("should handle complex object values", () => {
      lruCache = new LruCache();

      const complexObject = { id: 1, name: "test", nested: { value: "data" } };
      lruCache.set("key1", complexObject);

      const result = lruCache.get("key1");

      expect(result).toEqual(complexObject);
    });
  });

  describe("_isExpired", () => {
    it("should return true when entry is expired", () => {
      lruCache = new LruCache({ maxAge: 1000 });

      const entry = {
        value: "test",
        expiresAt: Date.now() - 1000,
      };

      const result = lruCache._isExpired(entry);

      expect(result).toBe(true);
    });

    it("should return false when entry is not expired", () => {
      lruCache = new LruCache({ maxAge: 1000 });

      const entry = {
        value: "test",
        expiresAt: Date.now() + 1000,
      };

      const result = lruCache._isExpired(entry);

      expect(result).toBe(false);
    });
  });
});
