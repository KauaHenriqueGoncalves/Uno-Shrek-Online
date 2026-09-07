import mongoose from "mongoose";
import TransactionRunner from "../../../../src/modules/shared/mongoose/transaction-runner.js";

jest.mock("mongoose", () => ({
  startSession: jest.fn(),
}));

describe("TransactionRunner", () => {
  let transactionRunner;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionRunner = new TransactionRunner();
  });

  describe("run", () => {
    it("should run operation within transaction (Happy Path)", async () => {
      const mockSession = {
        withTransaction: jest.fn(async (callback) => {
          await callback(mockSession);
        }),
        endSession: jest.fn(),
      };

      mongoose.startSession.mockResolvedValue(mockSession);

      const operationFn = jest.fn().mockResolvedValue({ success: true });

      const result = await transactionRunner.run(operationFn);

      expect(mongoose.startSession).toHaveBeenCalledTimes(1);
      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
      expect(operationFn).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual({ success: true });
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it("should fallback to operation without session when transactions are unsupported", async () => {
      const unsupportedError = new Error(
        "Transaction numbers are only allowed",
      );
      unsupportedError.code = 20;

      const mockSession = {
        withTransaction: jest.fn(async (callback) => {
          throw unsupportedError;
        }),
        endSession: jest.fn(),
      };

      mongoose.startSession.mockResolvedValue(mockSession);

      const operationFn = jest.fn().mockResolvedValue({ success: true });

      const result = await transactionRunner.run(operationFn);

      expect(operationFn).toHaveBeenCalledWith(null);
      expect(result).toEqual({ success: true });
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it("should fallback when error code is 20", async () => {
      const unsupportedError = new Error("Unsupported transaction");
      unsupportedError.code = 20;

      const mockSession = {
        withTransaction: jest.fn(async (callback) => {
          throw unsupportedError;
        }),
        endSession: jest.fn(),
      };

      mongoose.startSession.mockResolvedValue(mockSession);

      const operationFn = jest.fn().mockResolvedValue({ success: true });

      const result = await transactionRunner.run(operationFn);

      expect(operationFn).toHaveBeenCalledWith(null);
      expect(result).toEqual({ success: true });
    });

    it("should throw error when transaction fails for other reasons", async () => {
      const genericError = new Error("Generic error");

      const mockSession = {
        withTransaction: jest.fn(async (callback) => {
          throw genericError;
        }),
        endSession: jest.fn(),
      };

      mongoose.startSession.mockResolvedValue(mockSession);

      const operationFn = jest.fn();

      await expect(transactionRunner.run(operationFn)).rejects.toThrow(
        "Generic error",
      );
      expect(operationFn).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it("should always end session in finally block", async () => {
      const mockSession = {
        withTransaction: jest.fn(async (callback) => {
          throw new Error("Error in transaction");
        }),
        endSession: jest.fn(),
      };

      mongoose.startSession.mockResolvedValue(mockSession);

      const operationFn = jest.fn();

      await expect(transactionRunner.run(operationFn)).rejects.toThrow();
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("_isTransactionUnsupported", () => {
    it("should return true when error code is 20", () => {
      const error = { code: 20 };
      expect(transactionRunner._isTransactionUnsupported(error)).toBe(true);
    });

    it("should return true when error message contains 'Transaction numbers are only allowed'", () => {
      const error = new Error(
        "Transaction numbers are only allowed on replica set members",
      );
      expect(transactionRunner._isTransactionUnsupported(error)).toBe(true);
    });

    it("should return false for other errors", () => {
      const error = new Error("Other error");
      expect(transactionRunner._isTransactionUnsupported(error)).toBe(false);
    });

    it("should return false for null", () => {
      expect(transactionRunner._isTransactionUnsupported(null)).toBe(null);
    });
  });
});
