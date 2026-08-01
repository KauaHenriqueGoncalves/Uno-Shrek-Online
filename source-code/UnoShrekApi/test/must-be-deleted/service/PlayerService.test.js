import bcrypt from "bcryptjs";
import PlayerService from "../../src/service/PlayerService.js";
import PlayerRepository from "../../src/repository/PlayerRepository.js";
import PinoGlobal from "../../src/config/logger/PinoGlobal.js";
import { NotFoundError } from "../../src/config/exceptions/NotFoundError.js";
import { BusinessError } from "../../src/config/exceptions/BusinessError.js";
import { parseOrThrow } from "../../src/config/utils/validate.js";

jest.mock("../../src/repository/PlayerRepository.js");
jest.mock("../../src/config/logger/PinoGlobal.js");
jest.mock("../../src/config/utils/validate.js");
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

    playerService = new PlayerService({});
    repositoryMock = playerService.playerRepository;
  });

  describe("getAll", () => {
    it("should return all players", async () => {
      const players = [{ username: "kaua" }, { username: "shrek" }];
      repositoryMock.getAll.mockResolvedValue(players);

      const result = await playerService.getAll();

      expect(repositoryMock.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(players);
    });
  });

  describe("getById", () => {
    it("should return player when found", async () => {
      const player = { _id: "1", username: "kaua" };
      repositoryMock.getById.mockResolvedValue(player);

      const result = await playerService.getById("1");

      expect(repositoryMock.getById).toHaveBeenCalledWith("1");
      expect(result).toEqual(player);
    });

    it("should throw NotFoundError when player does not exist", async () => {
      repositoryMock.getById.mockResolvedValue(null);

      await expect(playerService.getById("1")).rejects.toThrow(NotFoundError);
      expect(repositoryMock.getById).toHaveBeenCalledWith("1");
    });
  });

  describe("create", () => {
    it("should create a player when email and username do not exist", async () => {
      const inputData = {
        username: "kaua",
        age: 20,
        email: "kaua@test.com",
        password: "password123",
      };
      const createdPlayer = { _id: "1", ...inputData, password: "hashed" };

      parseOrThrow.mockReturnValue(inputData);
      repositoryMock.getByEmail.mockResolvedValue(null);
      repositoryMock.getByUsername.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      repositoryMock.create.mockResolvedValue(createdPlayer);

      const result = await playerService.create(inputData);

      expect(repositoryMock.getByEmail).toHaveBeenCalledWith(inputData.email);
      expect(repositoryMock.getByUsername).toHaveBeenCalledWith(
        inputData.username,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(inputData.password, 10);
      expect(repositoryMock.create).toHaveBeenCalledWith({
        ...inputData,
        password: "hashed",
      });
      expect(result).toEqual(createdPlayer);
    });

    it("should throw BusinessError when email already exists", async () => {
      const inputData = {
        username: "kaua",
        age: 20,
        email: "kaua@test.com",
        password: "password123",
      };

      parseOrThrow.mockReturnValue(inputData);
      repositoryMock.getByEmail.mockResolvedValue({ _id: "1", ...inputData });

      await expect(playerService.create(inputData)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when username already exists", async () => {
      const inputData = {
        username: "kaua",
        age: 20,
        email: "kaua@test.com",
        password: "password123",
      };

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
  });

  describe("update", () => {
    it("should update player when it exists and email is unchanged", async () => {
      const id = "1";
      const existingPlayer = { _id: id, email: "kaua@test.com" };
      const updateData = { username: "shrek" };
      const updatedPlayer = { ...existingPlayer, ...updateData };

      parseOrThrow.mockReturnValue(updateData);
      repositoryMock.getById.mockResolvedValue(existingPlayer);
      repositoryMock.update.mockResolvedValue(updatedPlayer);

      const result = await playerService.update(id, updateData);

      expect(repositoryMock.getByEmail).not.toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalledWith(id, updateData);
      expect(result).toEqual(updatedPlayer);
    });

    it("should throw NotFoundError when player does not exist", async () => {
      const id = "1";
      const updateData = { username: "shrek" };

      parseOrThrow.mockReturnValue(updateData);
      repositoryMock.getById.mockResolvedValue(null);

      await expect(playerService.update(id, updateData)).rejects.toThrow(
        NotFoundError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw BusinessError when new email already belongs to another player", async () => {
      const id = "1";
      const existingPlayer = { _id: id, email: "old@test.com" };
      const updateData = { email: "new@test.com" };

      parseOrThrow.mockReturnValue(updateData);
      repositoryMock.getById.mockResolvedValue(existingPlayer);
      repositoryMock.getByEmail.mockResolvedValue({
        _id: "2",
        email: "new@test.com",
      });

      await expect(playerService.update(id, updateData)).rejects.toThrow(
        BusinessError,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteById", () => {
    it("should delete player when it exists", async () => {
      const id = "1";
      const existingPlayer = { _id: id };

      repositoryMock.getById.mockResolvedValue(existingPlayer);
      repositoryMock.deleteById.mockResolvedValue(existingPlayer);

      const result = await playerService.deleteById(id);

      expect(repositoryMock.deleteById).toHaveBeenCalledWith(id);
      expect(result).toEqual(existingPlayer);
    });

    it("should throw NotFoundError when player does not exist", async () => {
      const id = "1";
      repositoryMock.getById.mockResolvedValue(null);

      await expect(playerService.deleteById(id)).rejects.toThrow(NotFoundError);
      expect(repositoryMock.deleteById).not.toHaveBeenCalled();
    });
  });
});
