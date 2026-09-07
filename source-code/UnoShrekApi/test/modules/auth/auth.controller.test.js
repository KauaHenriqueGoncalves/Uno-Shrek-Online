import AuthController from "../../../src/modules/auth/auth.controller.js";
import JwtCoder from "../../../src/modules/shared/jwt/jwt-coder.js";
import PinoGlobal from "../../../src/modules/shared/logger/pino-global.logger.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";

jest.mock("../../../src/modules/shared/jwt/jwt-coder.js");
jest.mock("../../../src/modules/shared/logger/pino-global.logger.js");

describe("AuthController", () => {
  let controller;
  let authServiceMock;
  let playerServiceMock;
  let tokenServiceMock;
  let jwtCoderMock;
  let logMock;
  let res;

  beforeEach(() => {
    logMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    PinoGlobal.getInstance.mockReturnValue(logMock);
    
    jwtCoderMock = { 
      decode: jest.fn(),
      sign: jest.fn(),
    };
    JwtCoder.getInstance.mockReturnValue(jwtCoderMock);
    
    authServiceMock = {
      login: jest.fn(),
      googleAuth: jest.fn(),
    };
    
    playerServiceMock = {
      create: jest.fn(),
    };
    
    tokenServiceMock = { 
      blacklistToken: jest.fn(),
      isBlacklisted: jest.fn(),
    };
    
    controller = new AuthController(authServiceMock, playerServiceMock, tokenServiceMock);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerRoutes", () => {
    it("should register all routes", () => {
      const routes = controller.routers.stack.map(layer => ({
        path: layer.route?.path,
        methods: layer.route?.methods,
      }));

      expect(routes).toContainEqual({
        path: "/login",
        methods: expect.objectContaining({ post: true }),
      });
      expect(routes).toContainEqual({
        path: "/register",
        methods: expect.objectContaining({ post: true }),
      });
      expect(routes).toContainEqual({
        path: "/logout",
        methods: expect.objectContaining({ post: true }),
      });
      expect(routes).toContainEqual({
        path: "/google",
        methods: expect.objectContaining({ post: true }),
      });
    });
  });

  describe("login", () => {
    const loginPayload = { username: "testuser", password: "password123" };

    it("should set cookie and return token on successful login", async () => {
      const token = "jwt-token-123";
      authServiceMock.login.mockResolvedValue(token);

      const req = { body: loginPayload };

      await controller.login(req, res);

      expect(authServiceMock.login).toHaveBeenCalledWith(loginPayload);
      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        token,
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: expect.any(String),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ access_token: token });
    });

    it("should handle login service errors", async () => {
      const error = new Error("Invalid credentials");
      authServiceMock.login.mockRejectedValue(error);

      const req = { body: loginPayload };

      await expect(controller.login(req, res)).rejects.toThrow("Invalid credentials");
      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should blacklist the token, clear the cookie and return 200 when token is valid", async () => {
      const req = { cookies: { accessToken: "valid-token" }, body: {} };
      jwtCoderMock.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      tokenServiceMock.blacklistToken.mockResolvedValue({});

      await controller.logout(req, res);

      expect(jwtCoderMock.decode).toHaveBeenCalledWith("valid-token");
      expect(tokenServiceMock.blacklistToken).toHaveBeenCalledWith(
        "valid-token",
        expect.any(Date),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: expect.any(String),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
    });

    it("should handle token from body when cookie is not present", async () => {
      const req = { 
        cookies: {}, 
        body: { access_token: "body-token" } 
      };
      jwtCoderMock.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      tokenServiceMock.blacklistToken.mockResolvedValue({});

      await controller.logout(req, res);

      expect(jwtCoderMock.decode).toHaveBeenCalledWith("body-token");
      expect(tokenServiceMock.blacklistToken).toHaveBeenCalledWith(
        "body-token",
        expect.any(Date),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
    });

    it("should return 400 when there is no token", async () => {
      const req = { cookies: {}, body: {} };

      await controller.logout(req, res);

      expect(jwtCoderMock.decode).not.toHaveBeenCalled();
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

      expect(logMock.warn).toHaveBeenCalled();
      expect(tokenServiceMock.blacklistToken).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });
  });

  describe("register", () => {
    const registerPayload = { 
      username: "newuser", 
      email: "newuser@example.com", 
      password: "password123" 
    };

    it("should create user and return 201 on successful registration", async () => {
      playerServiceMock.create.mockResolvedValue({ _id: "new-id" });

      const req = { body: registerPayload };

      await controller.register(req, res);

      expect(playerServiceMock.create).toHaveBeenCalledWith(registerPayload);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "User registered successfully" 
      });
    });

    it("should return 400 when BusinessError occurs", async () => {
      playerServiceMock.create.mockRejectedValue(
        new BusinessError("User already exists")
      );

      const req = { body: registerPayload };

      await controller.register(req, res);

      expect(playerServiceMock.create).toHaveBeenCalledWith(registerPayload);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "The user already exists; please try again with different input.",
      });
    });

    it("should propagate non-BusinessError errors", async () => {
      const error = new Error("Unexpected error");
      playerServiceMock.create.mockRejectedValue(error);

      const req = { body: registerPayload };

      await expect(controller.register(req, res)).rejects.toThrow("Unexpected error");
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("googleAuth", () => {
    const googleAuthPayload = { accessToken: "google-access-token" };

    it("should authenticate with Google and return token", async () => {
      const token = "google-jwt-token";
      authServiceMock.googleAuth.mockResolvedValue(token);

      const req = { body: googleAuthPayload };

      await controller.googleAuth(req, res);

      expect(authServiceMock.googleAuth).toHaveBeenCalledWith("google-access-token");
      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        token,
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: expect.any(String),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ access_token: token });
    });

    it("should return 400 when accessToken is missing", async () => {
      const req = { body: {} };

      await controller.googleAuth(req, res);

      expect(authServiceMock.googleAuth).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: "accessToken is required" 
      });
    });

    it("should handle googleAuth service errors", async () => {
      const error = new Error("Invalid Google token");
      authServiceMock.googleAuth.mockRejectedValue(error);

      const req = { body: googleAuthPayload };

      await expect(controller.googleAuth(req, res)).rejects.toThrow("Invalid Google token");
      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});