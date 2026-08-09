import socketAuthMiddleware from "../../../../src/modules/shared/middleware/socket-auth.middleware.js";
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

describe("socketAuthMiddleware", () => {
  let jwtCoderMock;
  let logMock;
  let repoMock;
  let socket;
  let next;

  beforeEach(() => {
    jwtCoderMock = JwtCoder.getInstance();
    logMock = PinoGlobal.getInstance();
    repoMock = new BlacklistedTokenRepository();

    jest.clearAllMocks();

    socket = { id: "socket1", handshake: { headers: {} } };
    next = jest.fn();
  });

  it("should call next with UnauthorizedError when there is no token", async () => {
    socket.handshake.headers = {};

    await socketAuthMiddleware(socket, next);

    expect(logMock.warn).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(repoMock.existsByToken).not.toHaveBeenCalled();
  });

  it("should call next with UnauthorizedError when the token is blacklisted", async () => {
    socket.handshake.headers = { accesstoken: "blacklisted-token" };
    repoMock.existsByToken.mockResolvedValue(true);

    await socketAuthMiddleware(socket, next);

    expect(repoMock.existsByToken).toHaveBeenCalledWith("blacklisted-token");
    expect(logMock.warn).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(jwtCoderMock.decode).not.toHaveBeenCalled();
  });

  it("should decode the token and set socket.token/playerId when the token is valid", async () => {
    socket.handshake.headers = { accesstoken: "valid-token" };
    repoMock.existsByToken.mockResolvedValue(false);
    jwtCoderMock.decode.mockReturnValue({ id: "user1" });

    await socketAuthMiddleware(socket, next);

    expect(jwtCoderMock.decode).toHaveBeenCalledWith("valid-token");
    expect(socket.token).toBe("valid-token");
    expect(socket.playerId).toBe("user1");
    expect(logMock.info).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("should call next with a generic unauthorized error when decoding fails", async () => {
    socket.handshake.headers = { accesstoken: "invalid-token" };
    repoMock.existsByToken.mockResolvedValue(false);
    jwtCoderMock.decode.mockImplementation(() => {
      throw new Error("invalid token");
    });

    await socketAuthMiddleware(socket, next);

    expect(logMock.warn).toHaveBeenCalledWith(
      { err: "invalid token" },
      "socket auth failed",
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe("unauthorized");
  });

  it("should call next with a generic unauthorized error when the blacklist check throws", async () => {
    socket.handshake.headers = { accesstoken: "valid-token" };
    repoMock.existsByToken.mockRejectedValue(new Error("db error"));

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe("unauthorized");
  });
});
