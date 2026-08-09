import errorHandler from "../../../../src/modules/shared/middleware/error-handler.middleware.js";
import PinoGlobal from "../../../../src/modules/shared/logger/pino-global.logger.js";
import { AppError } from "../../../../src/modules/shared/errors/base/app.error.js";

jest.mock("../../../../src/modules/shared/logger/pino-global.logger.js");

describe("errorHandler", () => {
  let logMock;
  let req;
  let res;
  let next;

  beforeEach(() => {
    logMock = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
    PinoGlobal.getInstance.mockReturnValue(logMock);

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("should respond with the error's statusCode and message for an AppError", () => {
    const err = new AppError("Resource not found", 404);

    errorHandler(err, req, res, next);

    expect(logMock.warn).toHaveBeenCalledWith("Resource not found", {
      statusCode: 404,
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "Resource not found",
      }),
    );
  });

  it("should include an ISO timestamp in the AppError response", () => {
    const err = new AppError("Bad request", 400);

    errorHandler(err, req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.timestamp).toEqual(expect.any(String));
    expect(() => new Date(jsonArg.timestamp).toISOString()).not.toThrow();
  });

  it("should respond with 500 and a generic message for an unhandled error", () => {
    const err = new Error("Something exploded");

    errorHandler(err, req, res, next);

    expect(logMock.error).toHaveBeenCalledWith({ err }, "Unhandled error");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal Server Error",
    });
  });

  it("should not call next", () => {
    const err = new AppError("Some error", 400);

    errorHandler(err, req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});
