import AuthController from "../../../src/modules/auth/auth.controller.js";
import JwtCoder from "../../../src/modules/shared/jwt/jwt-coder.js";
import PinoGlobal from "../../../src/modules/shared/logger/pino-global.logger.js";

jest.mock("../../../src/modules/shared/jwt/jwt-coder.js");
jest.mock("../../../src/modules/shared/logger/pino-global.logger.js");

describe("AuthController", () => {
  let controller;
  let tokenServiceMock;
  let jwtCoderMock;
  let res;

  beforeEach(() => {
    PinoGlobal.getInstance.mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    });
    jwtCoderMock = { decode: jest.fn() };
    JwtCoder.getInstance.mockReturnValue(jwtCoderMock);
    tokenServiceMock = { blacklistToken: jest.fn() };
    controller = new AuthController({}, {}, tokenServiceMock);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
  });

  describe("logout", () => {
    it("should blacklist the token, clear the cookie and return 200 when token is valid", async () => {
      const req = { cookies: { accessToken: "valid-token" }, body: {} };
      jwtCoderMock.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      tokenServiceMock.blacklistToken.mockResolvedValue({});

      await controller.logout(req, res);

      expect(tokenServiceMock.blacklistToken).toHaveBeenCalledWith(
        "valid-token",
        expect.any(Date),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
    });

    it("should return 400 when there is no token", async () => {
      const req = { cookies: {}, body: {} };

      await controller.logout(req, res);

      expect(tokenServiceMock.blacklistToken).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "access_token is required to logout",
      });
    });

    it("should return 400 when token is invalid", async () => {
      const req = { cookies: { accessToken: "bad-token" }, body: {} };
      jwtCoderMock.decode.mockImplementation(() => {
        throw new Error("invalid token");
      });

      await controller.logout(req, res);

      expect(tokenServiceMock.blacklistToken).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });
  });
});
