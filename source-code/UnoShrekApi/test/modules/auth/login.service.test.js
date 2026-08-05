import bcrypt from "bcryptjs";
import LoginService from "../../../src/modules/auth/login.service.js";
import JwtCoder from "../../../src/modules/shared/jwt/jwt-coder.js";
import PinoGlobal from "../../../src/modules/shared/logger/pino-global.logger.js";
import { parseOrThrow } from "../../../src/modules/shared/utils/validate.js";
import { UnauthorizedError } from "../../../src/modules/shared/errors/unauthorized.error.js";
import { NotFoundError } from "../../../src/modules/shared/errors/not-found.error.js";

jest.mock("../../../src/modules/shared/jwt/jwt-coder.js");
jest.mock("../../../src/modules/shared/logger/pino-global.logger.js");
jest.mock("../../../src/modules/shared/utils/validate.js");
jest.mock("bcryptjs");

describe("LoginService", () => {
  let loginService;
  let playerServiceMock;
  let jwtCoderMock;

  beforeEach(() => {
    PinoGlobal.getInstance.mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    });
    jwtCoderMock = { sign: jest.fn() };
    JwtCoder.getInstance.mockReturnValue(jwtCoderMock);
    playerServiceMock = { getByUsername: jest.fn() };
    loginService = new LoginService(playerServiceMock);
  });

  describe("login", () => {
    const payload = { username: "kaua", password: "password123" };

    it("should return a token when credentials are correct", async () => {
      const player = { _id: "1", username: "kaua", password: "hashed" };

      parseOrThrow.mockReturnValue(payload);
      playerServiceMock.getByUsername.mockResolvedValue(player);
      bcrypt.compare.mockResolvedValue(true);
      jwtCoderMock.sign.mockReturnValue("token123");

      const result = await loginService.login(payload);

      expect(playerServiceMock.getByUsername).toHaveBeenCalledWith(
        payload.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        payload.password,
        player.password,
      );
      expect(jwtCoderMock.sign).toHaveBeenCalledWith(player._id);
      expect(result).toBe("token123");
    });

    it("should throw UnauthorizedError when username does not exist", async () => {
      parseOrThrow.mockReturnValue(payload);
      playerServiceMock.getByUsername.mockRejectedValue(
        new NotFoundError("Player not found"),
      );

      await expect(loginService.login(payload)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(jwtCoderMock.sign).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when password is incorrect", async () => {
      const player = { _id: "1", username: "kaua", password: "hashed" };

      parseOrThrow.mockReturnValue(payload);
      playerServiceMock.getByUsername.mockResolvedValue(player);
      bcrypt.compare.mockResolvedValue(false);

      await expect(loginService.login(payload)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(jwtCoderMock.sign).not.toHaveBeenCalled();
    });
  });
});
