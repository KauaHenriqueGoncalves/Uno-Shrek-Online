import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import PlayerService from "../../../src/modules/player/player.service.js";
import PlayerRepository from "../../../src/modules/player/player.repository.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";
import { NotFoundError } from "../../../src/modules/shared/errors/not-found.error.js";

describe("PlayerService", () => {
  let playerService;

  const mockSchema = {};
  process.env.JWT_SECRET = "segredinho_para_testes";

  beforeEach(() => {
    jest.clearAllMocks();

    playerService = new PlayerService(mockSchema);

    jest.spyOn(playerService.log, "info").mockImplementation(() => {});
    jest.spyOn(playerService.log, "warn").mockImplementation(() => {});
  });

  describe("getAll", () => {
    test("should return a list of players (Happy Path)", async () => {
      const playerList = [
        { _id: "1", username: "davi_uno" },
        { _id: "2", username: "gezonel" },
      ];

      jest
        .spyOn(PlayerRepository.prototype, "getAll")
        .mockResolvedValue(playerList);

      const result = await playerService.getAll();

      expect(result).toHaveLength(2);
      expect(result).toEqual(playerList);
    });
  });

  describe("getById", () => {
    const playerId = "12345";

    const existingPlayer = {
      _id: playerId,
      username: "davi_uno",
      email: "davi@teste.com",
    };

    test("should return a player when id exists (Happy Path)", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getById")
        .mockResolvedValue(existingPlayer);

      const result = await playerService.getById(playerId);

      expect(result).toEqual(existingPlayer);
      expect(result._id).toBe(playerId);
    });

    test("should throw an error when player id is not found", async () => {
      jest.spyOn(PlayerRepository.prototype, "getById").mockResolvedValue(null);

      await expect(playerService.getById(playerId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getAllByIds", () => {
    test("should return players matching the provided ids (Happy Path)", async () => {
      const ids = ["1", "2", "3"];
      const mockPlayers = [
        { _id: "1", username: "davi_uno" },
        { _id: "2", username: "gezonel" },
      ];

      const repositorySpy = jest
        .spyOn(PlayerRepository.prototype, "getAllByIds")
        .mockResolvedValue(mockPlayers);

      const result = await playerService.getAllByIds(ids);

      expect(repositorySpy).toHaveBeenCalledWith(ids);
      expect(result).toEqual(mockPlayers);
      expect(result).toHaveLength(2);
    });
  });

  describe("getByToken", () => {
    const token = "fake_jwt_token";
    const playerId = "12345";

    const existingPlayer = {
      _id: playerId,
      username: "davi_uno",
    };

    test("should return a player using decoded token id (Happy Path)", async () => {
      jest
        .spyOn(playerService.jwtCoder, "decode")
        .mockReturnValue({ id: playerId });
      jest.spyOn(playerService, "getById").mockResolvedValue(existingPlayer);

      const result = await playerService.getByToken(token);

      expect(playerService.jwtCoder.decode).toHaveBeenCalledWith(token);
      expect(playerService.getById).toHaveBeenCalledWith(playerId);
      expect(result).toEqual(existingPlayer);
    });
  });

  describe("getByUsername", () => {
    const username = "davi_uno";

    const existingPlayer = {
      _id: "1",
      username: username,
      email: "davi@teste.com",
    };

    test("should return a player when username exists (Happy Path)", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getByUsername")
        .mockResolvedValue(existingPlayer);

      const result = await playerService.getByUsername(username);

      expect(result).toEqual(existingPlayer);
      expect(result.username).toBe(username);
    });

    test("should throw an error when username is not found", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getByUsername")
        .mockResolvedValue(null);

      await expect(playerService.getByUsername(username)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("create", () => {
    const baseValidData = {
      username: "davi_uno",
      age: 20,
      email: "davi@uno.com",
      password: "senha_secreta",
    };

    test("should successfully create a player (Happy Path)", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getByEmail")
        .mockResolvedValue(null);
      jest
        .spyOn(PlayerRepository.prototype, "getByUsername")
        .mockResolvedValue(null);
      jest.spyOn(bcrypt, "hash").mockResolvedValue("senha_criptografada");
      jest.spyOn(PlayerRepository.prototype, "create").mockResolvedValue({
        _id: "12345",
        username: baseValidData.username,
        email: baseValidData.email,
        password: "senha_criptografada",
      });

      const result = await playerService.create(baseValidData);

      expect(result._id).toBe("12345");
      expect(result.username).toBe("davi_uno");
      expect(result.password).toBe("senha_criptografada");
    });

    test("should throw an error when email already exists", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getByEmail")
        .mockResolvedValue(baseValidData.email);

      await expect(playerService.create(baseValidData)).rejects.toThrow(
        BusinessError,
      );
    });

    test("should throw an error when username already exists", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getByEmail")
        .mockResolvedValue(null);
      jest
        .spyOn(PlayerRepository.prototype, "getByUsername")
        .mockResolvedValue(baseValidData.username);

      await expect(playerService.create(baseValidData)).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("update", () => {
    const playerId = "12345";

    const existingPlayer = {
      _id: playerId,
      username: "davi_uno",
      email: "davi@teste.com",
      password: "senha_hasheada",
    };

    const validUpdateData = {
      username: "gezonel_mestre_uno",
      email: "novo_email@teste.com",
    };

    test("should successfully update a player (Happy Path)", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getById")
        .mockResolvedValue(existingPlayer);
      jest
        .spyOn(PlayerRepository.prototype, "getByEmail")
        .mockResolvedValue(null);

      const updatedPlayer = { ...existingPlayer, ...validUpdateData };
      jest
        .spyOn(PlayerRepository.prototype, "update")
        .mockResolvedValue(updatedPlayer);

      const result = await playerService.update(playerId, validUpdateData);

      expect(result.username).toBe(validUpdateData.username);
      expect(result.email).toBe(validUpdateData.email);
    });

    test("should throw an error if player to update is not found", async () => {
      jest.spyOn(PlayerRepository.prototype, "getById").mockResolvedValue(null);

      await expect(
        playerService.update(playerId, validUpdateData),
      ).rejects.toThrow(NotFoundError);
    });

    test("should throw an error when trying to update to an already used email", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getById")
        .mockResolvedValue(existingPlayer);
      jest
        .spyOn(PlayerRepository.prototype, "getByEmail")
        .mockResolvedValue(true);

      await expect(
        playerService.update(playerId, validUpdateData),
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("delete", () => {
    const playerDeleteId = "12345";

    const existingPlayer = { _id: playerDeleteId, username: "davi_uno" };

    test("should successfully delete a player (Happy Path)", async () => {
      jest
        .spyOn(PlayerRepository.prototype, "getById")
        .mockResolvedValue(existingPlayer);
      jest
        .spyOn(PlayerRepository.prototype, "deleteById")
        .mockResolvedValue(true);

      const result = await playerService.deleteById(playerDeleteId);
      expect(result).toBe(true);
    });

    test("should throw an error if player to delete is not found", async () => {
      jest.spyOn(PlayerRepository.prototype, "getById").mockResolvedValue(null);

      await expect(playerService.deleteById(playerDeleteId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
