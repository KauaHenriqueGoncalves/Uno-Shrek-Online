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
  let logMock;

  beforeEach(() => {
    logMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    PinoGlobal.getInstance.mockReturnValue(logMock);
    
    jwtCoderMock = { sign: jest.fn() };
    JwtCoder.getInstance.mockReturnValue(jwtCoderMock);
    
    playerServiceMock = {
      getByUsername: jest.fn(),
      getByGoogleId: jest.fn(),
      getByEmailSafe: jest.fn(),
      linkGoogle: jest.fn(),
      createFromGoogle: jest.fn(),
    };
    
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

  describe("googleAuth", () => {
    const accessToken = "google-access-token";
    const googleUserData = {
      sub: "google123",
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/picture.jpg",
    };

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it("should return a token for a new Google user", async () => {
      const newPlayer = {
        _id: "new-player-id",
        username: googleUserData.name,
        email: googleUserData.email,
        googleId: googleUserData.sub,
        picture: googleUserData.picture,
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(googleUserData),
      });
      playerServiceMock.getByGoogleId.mockResolvedValue(null);
      playerServiceMock.getByEmailSafe.mockResolvedValue(null);
      playerServiceMock.createFromGoogle.mockResolvedValue(newPlayer);
      jwtCoderMock.sign.mockReturnValue("google-token-123");

      const result = await loginService.googleAuth(accessToken);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      expect(playerServiceMock.getByGoogleId).toHaveBeenCalledWith(
        googleUserData.sub
      );
      expect(playerServiceMock.getByEmailSafe).toHaveBeenCalledWith(
        googleUserData.email
      );
      expect(playerServiceMock.createFromGoogle).toHaveBeenCalledWith({
        username: googleUserData.name,
        email: googleUserData.email,
        googleId: googleUserData.sub,
        picture: googleUserData.picture,
      });
      expect(jwtCoderMock.sign).toHaveBeenCalledWith(newPlayer._id);
      expect(result).toBe("google-token-123");
    });

    it("should return a token for an existing Google user", async () => {
      const existingPlayer = {
        _id: "existing-player-id",
        googleId: googleUserData.sub,
        email: googleUserData.email,
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(googleUserData),
      });
      playerServiceMock.getByGoogleId.mockResolvedValue(existingPlayer);
      jwtCoderMock.sign.mockReturnValue("google-token-456");

      const result = await loginService.googleAuth(accessToken);

      expect(playerServiceMock.getByGoogleId).toHaveBeenCalledWith(
        googleUserData.sub
      );
      expect(playerServiceMock.getByEmailSafe).not.toHaveBeenCalled();
      expect(jwtCoderMock.sign).toHaveBeenCalledWith(existingPlayer._id);
      expect(result).toBe("google-token-456");
    });

    it("should link Google account to existing player with same email", async () => {
      const existingPlayerByEmail = {
        _id: "email-player-id",
        email: googleUserData.email,
      };
      const linkedPlayer = {
        ...existingPlayerByEmail,
        googleId: googleUserData.sub,
        picture: googleUserData.picture,
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(googleUserData),
      });
      playerServiceMock.getByGoogleId.mockResolvedValue(null);
      playerServiceMock.getByEmailSafe.mockResolvedValue(existingPlayerByEmail);
      playerServiceMock.linkGoogle.mockResolvedValue(linkedPlayer);
      jwtCoderMock.sign.mockReturnValue("google-token-789");

      const result = await loginService.googleAuth(accessToken);

      expect(playerServiceMock.getByGoogleId).toHaveBeenCalledWith(
        googleUserData.sub
      );
      expect(playerServiceMock.getByEmailSafe).toHaveBeenCalledWith(
        googleUserData.email
      );
      expect(playerServiceMock.linkGoogle).toHaveBeenCalledWith(
        existingPlayerByEmail._id,
        googleUserData.sub,
        googleUserData.picture
      );
      expect(jwtCoderMock.sign).toHaveBeenCalledWith(linkedPlayer._id);
      expect(result).toBe("google-token-789");
    });

    it("should throw UnauthorizedError when Google token is invalid", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(loginService.googleAuth(accessToken)).rejects.toThrow(
        UnauthorizedError
      );
      expect(logMock.warn).toHaveBeenCalled();
      expect(jwtCoderMock.sign).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when fetch fails", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"));

      await expect(loginService.googleAuth(accessToken)).rejects.toThrow(
        UnauthorizedError
      );
      expect(logMock.warn).toHaveBeenCalled();
      expect(jwtCoderMock.sign).not.toHaveBeenCalled();
    });
  });
});