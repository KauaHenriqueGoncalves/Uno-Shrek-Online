import FriendshipService from "../../../src/modules/friendship/friendship.service.js";
import { NotFoundError } from "../../../src/modules/shared/errors/not-found.error.js";
import { BusinessError } from "../../../src/modules/shared/errors/business.error.js";
import { UnauthorizedError } from "../../../src/modules/shared/errors/unauthorized.error.js";
import { parseOrThrow } from "../../../src/modules/shared/utils/validate.js";
import { FRIENDSHIP_STATUS } from "../../../src/modules/friendship/friendship.schema.js";

jest.mock("../../../src/modules/friendship/friendship.repository.js", () => {
  return jest.fn().mockImplementation(() => ({
    getBetween: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getById: jest.fn(),
    deleteById: jest.fn(),
    getFriends: jest.fn(),
    getPendingReceived: jest.fn(),
    getPendingSent: jest.fn(),
  }));
});

jest.mock("../../../src/modules/shared/logger/pino-global.logger.js", () => ({
  getInstance: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("../../../src/modules/shared/utils/validate.js", () => ({
  parseOrThrow: jest.fn(),
}));

describe("FriendshipService", () => {
  let service;
  let playerService;

  beforeEach(() => {
    jest.clearAllMocks();
    playerService = { getById: jest.fn() };
    service = new FriendshipService({}, playerService);
  });

  describe("sendRequest", () => {
    beforeEach(() => {
      parseOrThrow.mockImplementation((_, data) => data);
      playerService.getById.mockResolvedValue({ _id: "recipient1" });
    });

    it("throws BusinessError when requester tries to friend themselves", async () => {
      await expect(
        service.sendRequest("player1", { recipientId: "player1" }),
      ).rejects.toThrow(BusinessError);
    });

    it("creates a new friendship request when none exists between the players", async () => {
      service.friendshipRepository.getBetween.mockResolvedValue(null);
      const created = { _id: "f1" };
      service.friendshipRepository.create.mockResolvedValue(created);

      const result = await service.sendRequest("player1", {
        recipientId: "recipient1",
      });

      expect(service.friendshipRepository.create).toHaveBeenCalledWith({
        requester: "player1",
        recipient: "recipient1",
        status: FRIENDSHIP_STATUS.PENDING,
      });
      expect(result).toBe(created);
    });

    it("throws BusinessError when players are already friends", async () => {
      service.friendshipRepository.getBetween.mockResolvedValue({
        _id: "f1",
        status: FRIENDSHIP_STATUS.ACCEPTED,
      });

      await expect(
        service.sendRequest("player1", { recipientId: "recipient1" }),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when a friend request is already pending", async () => {
      service.friendshipRepository.getBetween.mockResolvedValue({
        _id: "f1",
        status: FRIENDSHIP_STATUS.PENDING,
      });

      await expect(
        service.sendRequest("player1", { recipientId: "recipient1" }),
      ).rejects.toThrow(BusinessError);
    });

    it("resends the request (resets to pending) when a previous rejected/removed friendship exists", async () => {
      service.friendshipRepository.getBetween.mockResolvedValue({
        _id: "f1",
        status: FRIENDSHIP_STATUS.REJECTED,
      });
      const resent = { _id: "f1", status: FRIENDSHIP_STATUS.PENDING };
      service.friendshipRepository.update.mockResolvedValue(resent);

      const result = await service.sendRequest("player1", {
        recipientId: "recipient1",
      });

      expect(service.friendshipRepository.update).toHaveBeenCalledWith("f1", {
        requester: "player1",
        recipient: "recipient1",
        status: FRIENDSHIP_STATUS.PENDING,
      });
      expect(result).toBe(resent);
    });

    it("validates input data using parseOrThrow", async () => {
      service.friendshipRepository.getBetween.mockResolvedValue(null);
      service.friendshipRepository.create.mockResolvedValue({ _id: "f1" });

      await service.sendRequest("player1", { recipientId: "recipient1" });

      expect(parseOrThrow).toHaveBeenCalled();
    });

    it("checks that the recipient exists before sending the request", async () => {
      service.friendshipRepository.getBetween.mockResolvedValue(null);
      service.friendshipRepository.create.mockResolvedValue({ _id: "f1" });

      await service.sendRequest("player1", { recipientId: "recipient1" });

      expect(playerService.getById).toHaveBeenCalledWith("recipient1");
    });
  });

  describe("acceptRequest", () => {
    it("accepts a pending friendship request owned by the recipient", async () => {
      service.friendshipRepository.getById.mockResolvedValue({
        _id: "f1",
        recipient: { toString: () => "player1" },
        status: FRIENDSHIP_STATUS.PENDING,
      });
      const accepted = { _id: "f1", status: FRIENDSHIP_STATUS.ACCEPTED };
      service.friendshipRepository.update.mockResolvedValue(accepted);

      const result = await service.acceptRequest("player1", "f1");

      expect(service.friendshipRepository.update).toHaveBeenCalledWith("f1", {
        status: FRIENDSHIP_STATUS.ACCEPTED,
      });
      expect(result).toBe(accepted);
    });

    it("throws NotFoundError when the friendship does not exist", async () => {
      service.friendshipRepository.getById.mockResolvedValue(null);

      await expect(service.acceptRequest("player1", "f1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws UnauthorizedError when the player is not the recipient", async () => {
      service.friendshipRepository.getById.mockResolvedValue({
        _id: "f1",
        recipient: { toString: () => "someoneElse" },
        status: FRIENDSHIP_STATUS.PENDING,
      });

      await expect(service.acceptRequest("player1", "f1")).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("throws BusinessError when the request is no longer pending", async () => {
      service.friendshipRepository.getById.mockResolvedValue({
        _id: "f1",
        recipient: { toString: () => "player1" },
        status: FRIENDSHIP_STATUS.ACCEPTED,
      });

      await expect(service.acceptRequest("player1", "f1")).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("rejectRequest", () => {
    it("rejects a pending friendship request owned by the recipient", async () => {
      service.friendshipRepository.getById.mockResolvedValue({
        _id: "f1",
        recipient: { toString: () => "player1" },
        status: FRIENDSHIP_STATUS.PENDING,
      });
      const rejected = { _id: "f1", status: FRIENDSHIP_STATUS.REJECTED };
      service.friendshipRepository.update.mockResolvedValue(rejected);

      const result = await service.rejectRequest("player1", "f1");

      expect(service.friendshipRepository.update).toHaveBeenCalledWith("f1", {
        status: FRIENDSHIP_STATUS.REJECTED,
      });
      expect(result).toBe(rejected);
    });

    it("throws NotFoundError when the friendship does not exist", async () => {
      service.friendshipRepository.getById.mockResolvedValue(null);

      await expect(service.rejectRequest("player1", "f1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws UnauthorizedError when the player is not the recipient", async () => {
      service.friendshipRepository.getById.mockResolvedValue({
        _id: "f1",
        recipient: { toString: () => "someoneElse" },
        status: FRIENDSHIP_STATUS.PENDING,
      });

      await expect(service.rejectRequest("player1", "f1")).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("throws BusinessError when the request is no longer pending", async () => {
      service.friendshipRepository.getById.mockResolvedValue({
        _id: "f1",
        recipient: { toString: () => "player1" },
        status: FRIENDSHIP_STATUS.REJECTED,
      });

      await expect(service.rejectRequest("player1", "f1")).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("removeFriend", () => {
    const buildFriendship = (over = {}) => ({
      _id: "f1",
      requester: { toString: () => "player1" },
      recipient: { toString: () => "player2" },
      status: FRIENDSHIP_STATUS.ACCEPTED,
      ...over,
    });

    it("removes the friendship when the player is part of it and it's accepted", async () => {
      const friendship = buildFriendship();
      service.friendshipRepository.getById.mockResolvedValue(friendship);
      service.friendshipRepository.deleteById.mockResolvedValue(friendship);

      const result = await service.removeFriend("player1", "f1");

      expect(service.friendshipRepository.deleteById).toHaveBeenCalledWith(
        "f1",
      );
      expect(result).toBe(friendship);
    });

    it("allows removal when the player is the recipient (not just the requester)", async () => {
      const friendship = buildFriendship();
      service.friendshipRepository.getById.mockResolvedValue(friendship);
      service.friendshipRepository.deleteById.mockResolvedValue(friendship);

      await expect(service.removeFriend("player2", "f1")).resolves.toBe(
        friendship,
      );
    });

    it("throws NotFoundError when the friendship does not exist", async () => {
      service.friendshipRepository.getById.mockResolvedValue(null);

      await expect(service.removeFriend("player1", "f1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws UnauthorizedError when the player is not part of the friendship", async () => {
      const friendship = buildFriendship();
      service.friendshipRepository.getById.mockResolvedValue(friendship);

      await expect(service.removeFriend("someoneElse", "f1")).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("throws BusinessError when the friendship is not accepted", async () => {
      const friendship = buildFriendship({
        status: FRIENDSHIP_STATUS.PENDING,
      });
      service.friendshipRepository.getById.mockResolvedValue(friendship);

      await expect(service.removeFriend("player1", "f1")).rejects.toThrow(
        BusinessError,
      );
    });
  });

  describe("listFriends", () => {
    it("returns the list of friends for the player", async () => {
      const friends = [{ _id: "p2" }];
      service.friendshipRepository.getFriends.mockResolvedValue(friends);

      const result = await service.listFriends("player1");

      expect(service.friendshipRepository.getFriends).toHaveBeenCalledWith(
        "player1",
      );
      expect(result).toBe(friends);
    });
  });

  describe("listPendingReceived", () => {
    it("returns the list of pending received requests for the player", async () => {
      const requests = [{ _id: "f1" }];
      service.friendshipRepository.getPendingReceived.mockResolvedValue(
        requests,
      );

      const result = await service.listPendingReceived("player1");

      expect(
        service.friendshipRepository.getPendingReceived,
      ).toHaveBeenCalledWith("player1");
      expect(result).toBe(requests);
    });
  });

  describe("listPendingSent", () => {
    it("returns the list of pending sent requests for the player", async () => {
      const requests = [{ _id: "f1" }];
      service.friendshipRepository.getPendingSent.mockResolvedValue(requests);

      const result = await service.listPendingSent("player1");

      expect(service.friendshipRepository.getPendingSent).toHaveBeenCalledWith(
        "player1",
      );
      expect(result).toBe(requests);
    });
  });

  describe("assertAreFriends", () => {
    it("returns the friendship when players are accepted friends", async () => {
      const friendship = { status: FRIENDSHIP_STATUS.ACCEPTED };
      service.friendshipRepository.getBetween.mockResolvedValue(friendship);

      const result = await service.assertAreFriends("player1", "player2");

      expect(result).toBe(friendship);
    });

    it("throws BusinessError when there is no friendship between the players", async () => {
      service.friendshipRepository.getBetween.mockResolvedValue(null);

      await expect(
        service.assertAreFriends("player1", "player2"),
      ).rejects.toThrow(BusinessError);
    });

    it("throws BusinessError when the friendship is not accepted", async () => {
      service.friendshipRepository.getBetween.mockResolvedValue({
        status: FRIENDSHIP_STATUS.PENDING,
      });

      await expect(
        service.assertAreFriends("player1", "player2"),
      ).rejects.toThrow(BusinessError);
    });
  });
});
