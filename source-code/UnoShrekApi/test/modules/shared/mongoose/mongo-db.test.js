import mongoose from "mongoose";
import MongoDb from "../../../../src/modules/shared/mongoose/mongo-db.js";
import { DatabaseConnectionError } from "../../../../src/modules/shared/errors/database-connection.error.js";

jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

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

describe("MongoDb", () => {
  let mongoDb;
  let log;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.MONGODB_USER = "test_user";
    process.env.MONGODB_PASSWORD = "test_password";
    process.env.MONGODB_HOST = "localhost";
    process.env.MONGODB_PORT = "27017";
    process.env.MONGODB_NAME = "test_db";

    mongoDb = new MongoDb();
    log =
      require("../../../../src/modules/shared/logger/pino-global.logger.js").default.getInstance();
  });

  afterEach(() => {
    delete process.env.MONGODB_USER;
    delete process.env.MONGODB_PASSWORD;
    delete process.env.MONGODB_HOST;
    delete process.env.MONGODB_PORT;
    delete process.env.MONGODB_NAME;
  });

  describe("constructor", () => {
    it("should initialize with environment variables", () => {
      expect(mongoDb.database).toBe(mongoose);
      expect(mongoDb.user).toBe("test_user");
      expect(mongoDb.password).toBe("test_password");
      expect(mongoDb.host).toBe("localhost");
      expect(mongoDb.port).toBe("27017");
      expect(mongoDb.name).toBe("test_db");
    });
  });

  describe("connect", () => {
    it("should connect to MongoDB successfully (Happy Path)", async () => {
      mongoose.connect.mockResolvedValue();

      await mongoDb.connect();

      expect(mongoose.connect).toHaveBeenCalledWith(
        "mongodb://test_user:test_password@localhost:27017/test_db?authSource=admin",
      );
    });

    it("should throw DatabaseConnectionError when connection fails", async () => {
      const error = new Error("Connection failed");
      mongoose.connect.mockRejectedValue(error);

      await expect(mongoDb.connect()).rejects.toThrow(DatabaseConnectionError);
    });
  });
});
