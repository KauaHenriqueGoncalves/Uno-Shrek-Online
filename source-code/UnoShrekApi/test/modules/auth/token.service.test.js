import TokenService from "../../../src/modules/auth/token.service.js";
import BlacklistedTokenRepository from "../../../src/modules/shared/blacklisted-token/blacklisted-token.repository.js";
import BlacklistedToken from "../../../src/modules/shared/blacklisted-token/blacklisted-token.schema.js";

jest.mock(
  "../../../src/modules/shared/blacklisted-token/blacklisted-token.repository.js",
);

jest.mock(
  "../../../src/modules/shared/blacklisted-token/blacklisted-token.schema.js",
);

describe("TokenService", () => {
  let tokenService;
  let repoMock;

  beforeEach(() => {
    repoMock = {
      create: jest.fn(),
      existsByToken: jest.fn(),
    };
    BlacklistedTokenRepository.mockImplementation(() => repoMock);
    tokenService = new TokenService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should instantiate BlacklistedTokenRepository with BlacklistedToken schema", () => {
      expect(BlacklistedTokenRepository).toHaveBeenCalledWith(BlacklistedToken);
      expect(BlacklistedTokenRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe("blacklistToken", () => {
    const token = "jwt-token-123";
    const expiresAt = new Date("2024-12-31T23:59:59Z");

    it("should blacklist a token successfully", async () => {
      const expectedResult = {
        _id: "blacklist-id-1",
        token,
        expiresAt,
      };

      repoMock.create.mockResolvedValue(expectedResult);

      const result = await tokenService.blacklistToken(token, expiresAt);

      expect(repoMock.create).toHaveBeenCalledWith({ token, expiresAt });
      expect(repoMock.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it("should propagate errors when blacklisting fails", async () => {
      const error = new Error("Database error");
      repoMock.create.mockRejectedValue(error);

      await expect(
        tokenService.blacklistToken(token, expiresAt),
      ).rejects.toThrow("Database error");

      expect(repoMock.create).toHaveBeenCalledWith({ token, expiresAt });
    });

    it("should handle duplicate token blacklisting", async () => {
      const duplicateError = new Error("Duplicate key error");
      duplicateError.code = 11000;
      repoMock.create.mockRejectedValue(duplicateError);

      await expect(
        tokenService.blacklistToken(token, expiresAt),
      ).rejects.toThrow("Duplicate key error");

      expect(repoMock.create).toHaveBeenCalledWith({ token, expiresAt });
    });
  });

  describe("isBlacklisted", () => {
    const token = "jwt-token-456";

    it("should return true when token is blacklisted", async () => {
      repoMock.existsByToken.mockResolvedValue(true);

      const result = await tokenService.isBlacklisted(token);

      expect(repoMock.existsByToken).toHaveBeenCalledWith(token);
      expect(repoMock.existsByToken).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it("should return false when token is not blacklisted", async () => {
      repoMock.existsByToken.mockResolvedValue(false);

      const result = await tokenService.isBlacklisted(token);

      expect(repoMock.existsByToken).toHaveBeenCalledWith(token);
      expect(repoMock.existsByToken).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });

    it("should propagate errors when checking blacklist fails", async () => {
      const error = new Error("Database connection error");
      repoMock.existsByToken.mockRejectedValue(error);

      await expect(tokenService.isBlacklisted(token)).rejects.toThrow(
        "Database connection error",
      );

      expect(repoMock.existsByToken).toHaveBeenCalledWith(token);
    });

    it("should handle null or undefined token", async () => {
      repoMock.existsByToken.mockResolvedValue(false);

      await tokenService.isBlacklisted(null);
      await tokenService.isBlacklisted(undefined);

      expect(repoMock.existsByToken).toHaveBeenCalledWith(null);
      expect(repoMock.existsByToken).toHaveBeenCalledWith(undefined);
      expect(repoMock.existsByToken).toHaveBeenCalledTimes(2);
    });
  });

  describe("integration scenarios", () => {
    it("should blacklist a token and then verify it is blacklisted", async () => {
      const token = "integration-token-789";
      const expiresAt = new Date("2024-12-31T23:59:59Z");

      repoMock.create.mockResolvedValue({ _id: "1", token, expiresAt });
      repoMock.existsByToken.mockResolvedValue(true);

      await tokenService.blacklistToken(token, expiresAt);
      const isBlacklisted = await tokenService.isBlacklisted(token);

      expect(repoMock.create).toHaveBeenCalledWith({ token, expiresAt });
      expect(repoMock.existsByToken).toHaveBeenCalledWith(token);
      expect(isBlacklisted).toBe(true);
    });

    it("should handle TTL expiry correctly", async () => {
      const token = "ttl-token-101";
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3600000); // 1 hour from now

      repoMock.create.mockResolvedValue({
        _id: "ttl-id",
        token,
        expiresAt,
      });

      const result = await tokenService.blacklistToken(token, expiresAt);

      expect(result.expiresAt).toEqual(expiresAt);
      expect(result.expiresAt.getTime()).toBeGreaterThan(now.getTime());
      expect(repoMock.create).toHaveBeenCalledWith({ token, expiresAt });
    });
  });
});
