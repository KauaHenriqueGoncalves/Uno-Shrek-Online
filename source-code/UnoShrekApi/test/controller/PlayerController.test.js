import request from "supertest";
import express from "express";
import errorHandler from "../../src/config/middleware/errorHandler.js";
import PlayerController from "../../src/controller/PlayerController.js";
import { NotFoundError } from "../../src/config/exceptions/NotFoundError.js";

describe("PlayerController", () => {
  let app;
  let serviceMock;

  beforeEach(() => {
    serviceMock = {
      getAll: jest.fn(),
      getByMe: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn(),
    };

    const controller = new PlayerController(serviceMock);

    app = express();
    app.use(express.json());
    app.use("/players", controller.routers);
    app.use(errorHandler);
  });

  describe("GET /players", () => {
    it("should return status 200 with a list of players", async () => {
      const now = new Date();
      serviceMock.getAll.mockResolvedValue([
        {
          _id: "1",
          username: "kaua",
          age: 20,
          email: "kaua@test.com",
          createdAt: now,
        },
      ]);

      const response = await request(app).get("/players");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: "1",
          username: "kaua",
          age: 20,
          email: "kaua@test.com",
          createdAt: now.toISOString(),
        },
      ]);
      expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /players/:id", () => {
    it("should return status 200 with the player", async () => {
      const now = new Date();
      serviceMock.getById.mockResolvedValue({
        _id: "1",
        username: "kaua",
        age: 20,
        email: "kaua@test.com",
        createdAt: now,
      });

      const response = await request(app).get("/players/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: "1",
        username: "kaua",
        age: 20,
        email: "kaua@test.com",
        createdAt: now.toISOString(),
      });
      expect(serviceMock.getById).toHaveBeenCalledWith("1");
    });

    it("should return status 404 when player is not found", async () => {
      serviceMock.getById.mockRejectedValue(
        new NotFoundError("Player not found"),
      );

      const response = await request(app).get("/players/1");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Player not found");
    });
  });

  describe("POST /players", () => {
    it("should return status 201 with the created player", async () => {
      const now = new Date();
      const requestBody = { username: "kaua", age: 20, email: "kaua@test.com" };

      serviceMock.create.mockResolvedValue({
        _id: "1",
        ...requestBody,
        createdAt: now,
      });

      const response = await request(app).post("/players").send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: "1",
        username: "kaua",
        age: 20,
        email: "kaua@test.com",
        createdAt: now.toISOString(),
      });
      expect(serviceMock.create).toHaveBeenCalledWith(requestBody);
    });
  });
});
