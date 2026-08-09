import authMiddleware from "../../../../src/modules/shared/middleware/auth.middleware.js";
import JwtCoder from "../../../../src/modules/shared/jwt/jwt-coder.js";
import PinoGlobal from "../../../../src/modules/shared/logger/pino-global.logger.js";
import BlacklistedTokenRepository from "../../../../src/modules/shared/blacklisted-token/blacklisted-token.repository.js";
import { UnauthorizedError } from "../../../../src/modules/shared/errors/unauthorized.error.js";

jest.mock("../../../../src/modules/shared/jwt/jwt-coder.js", () => {
  const instance = { decode: jest.fn() };
  return { __esModule: true, default: { getInstance: () => instance } };
});

jest.mock("../../../../src/modules/shared/logger/pino-global.logger.js", () => {
  const instance = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return { __esModule: true, default: { getInstance: () => instance } };
});

jest.mock(
  "../../../../src/modules/shared/blacklisted-token/blacklisted-token.repository.js",
  () => {
    const instance = { existsByToken: jest.fn() };
    return { __esModule: true, default: jest.fn(() => instance) };
  },
);

jest.mock(
  "../../../../src/modules/shared/blacklisted-token/blacklisted-token.schema.js",
  () => ({ __esModule: true, default: {} }),
);

describe("authMiddleware", () => {
  let jwtCoderMock;
  let logMock;
  let repoMock;
  let req;
  let res;
  let next;

  beforeEach(() => {
    jwtCoderMock = JwtCoder.getInstance();
    logMock = PinoGlobal.getInstance();
    repoMock = new BlacklistedTokenRepository();

    jest.clearAllMocks();

    req = { cookies: {} };
    res = {};
    next = jest.fn();
  });

  it("should call next with UnauthorizedError when there is no token", async () => {
    req.cookies = {};

    await authMiddleware(req, res, next);

    expect(logMock.warn).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(repoMock.existsByToken).not.toHaveBeenCalled();
  });

  it("should call next with UnauthorizedError when the token is blacklisted", async () => {
    req.cookies = { accessToken: "blacklisted-token" };
    repoMock.existsByToken.mockResolvedValue(true);

    await authMiddleware(req, res, next);

    expect(repoMock.existsByToken).toHaveBeenCalledWith("blacklisted-token");
    expect(logMock.warn).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(jwtCoderMock.decode).not.toHaveBeenCalled();
  });

  it("should call next with UnauthorizedError when checking the blacklist fails", async () => {
    req.cookies = { accessToken: "valid-token" };
    repoMock.existsByToken.mockRejectedValue(new Error("db error"));

    await authMiddleware(req, res, next);

    expect(logMock.error).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(jwtCoderMock.decode).not.toHaveBeenCalled();
  });

  it("should decode the token, set req.user and call next when the token is valid", async () => {
    req.cookies = { accessToken: "valid-token" };
    repoMock.existsByToken.mockResolvedValue(false);
    jwtCoderMock.decode.mockReturnValue({ id: "user1" });

    await authMiddleware(req, res, next);

    expect(jwtCoderMock.decode).toHaveBeenCalledWith("valid-token");
    expect(req.user).toEqual({ id: "user1" });
    expect(next).toHaveBeenCalledWith();
  });

  it("should call next with the decode error when the token is invalid", async () => {
    req.cookies = { accessToken: "invalid-token" };
    repoMock.existsByToken.mockResolvedValue(false);
    const decodeError = new Error("invalid token");
    jwtCoderMock.decode.mockImplementation(() => {
      throw decodeError;
    });

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(decodeError);
  });
});
