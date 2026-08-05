import PlayerService from "../../../src/modules/player/player.service.js";
import JwtCoder from "../../../src/modules/shared/jwt/jwt-coder.js";
import PinoGlobal from "../../../src/modules/shared/logger/pino-global.logger.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";
import { IlegalInputError } from "../../../src/modules/shared/errors/ilegal-input.error.js";
import { parseOrThrow } from "../../../src/modules/shared/utils/validate.js";

jest.mock("../../../src/modules/player/player.repository.js");
jest.mock("../../../src/modules/shared/jwt/jwt-coder.js");
jest.mock("../../../src/modules/shared/logger/pino-global.logger.js");
jest.mock("../../../src/modules/shared/utils/validate.js");
jest.mock("bcryptjs");

describe("PlayerService", () => {
  let playerService;
  let repositoryMock;

  beforeEach(() => {
    PinoGlobal.getInstance.mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    });
    JwtCoder.getInstance.mockReturnValue({});
    playerService = new PlayerService({});
    repositoryMock = playerService.playerRepository;
  });

  describe("create", () => {
    const inputData = {
      username: "kaua",
      age: 20,
      email: "kaua@test.com",
      password: "password123",
    };

    it("should throw BusinessError when email already exists", async () => {
      parseOrThrow.mockReturnValue(inputData);
      repositoryMock.getByEmail.mockResolvedValue({ _id: "1", ...inputData });

      await expect(playerService.create(inputData)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when username already exists", async () => {
      parseOrThrow.mockReturnValue(inputData);
      repositoryMock.getByEmail.mockResolvedValue(null);
      repositoryMock.getByUsername.mockResolvedValue({
        _id: "1",
        ...inputData,
      });

      await expect(playerService.create(inputData)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw IlegalInputError when password is invalid", async () => {
      parseOrThrow.mockImplementation(() => {
        throw new IlegalInputError("Validation failed");
      });

      await expect(
        playerService.create({ ...inputData, password: "short" }),
      ).rejects.toThrow(IlegalInputError);
      expect(repositoryMock.getByEmail).not.toHaveBeenCalled();
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });
});
