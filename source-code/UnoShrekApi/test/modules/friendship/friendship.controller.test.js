import FriendshipController from "../../../src/modules/friendship/friendship.controller.js";
import FriendshipResponseDto from "../../../src/modules/friendship/response/friendship.response.dto.js";
import authMiddleware from "../../../src/modules/shared/middleware/auth.middleware.js";

jest.mock(
  "../../../src/modules/friendship/response/friendship.response.dto.js",
);
jest.mock("../../../src/modules/shared/middleware/auth.middleware.js", () => {
  return jest.fn((req, res, next) => next());
});

describe("FriendshipController", () => {
  let controller;
  let serviceMock;
  let res;

  beforeEach(() => {
    serviceMock = {
      listFriends: jest.fn(),
      listPendingReceived: jest.fn(),
      listPendingSent: jest.fn(),
      sendRequest: jest.fn(),
      acceptRequest: jest.fn(),
      rejectRequest: jest.fn(),
      removeFriend: jest.fn(),
    };

    controller = new FriendshipController(serviceMock);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    FriendshipResponseDto.fromFriendList = jest.fn();
    FriendshipResponseDto.fromPendingReceivedList = jest.fn();
    FriendshipResponseDto.fromPendingSentList = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listFriends", () => {
    const userId = "507f1f77bcf86cd799439011";

    it("should return list of friends", async () => {
      const friendships = [
        {
          _id: "friendship1",
          requester: { _id: userId, username: "user1" },
          recipient: { _id: "user2", username: "user2" },
        },
      ];
      const responseData = [
        { id: "friendship1", friendId: "user2", username: "user2" },
      ];

      serviceMock.listFriends.mockResolvedValue(friendships);
      FriendshipResponseDto.fromFriendList.mockReturnValue(responseData);

      const req = { user: { id: userId } };

      await controller.listFriends(req, res);

      expect(serviceMock.listFriends).toHaveBeenCalledWith(userId);
      expect(FriendshipResponseDto.fromFriendList).toHaveBeenCalledWith(
        friendships,
        userId,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(responseData);
    });

    it("should handle empty friends list", async () => {
      serviceMock.listFriends.mockResolvedValue([]);
      FriendshipResponseDto.fromFriendList.mockReturnValue([]);

      const req = { user: { id: userId } };

      await controller.listFriends(req, res);

      expect(serviceMock.listFriends).toHaveBeenCalledWith(userId);
      expect(FriendshipResponseDto.fromFriendList).toHaveBeenCalledWith(
        [],
        userId,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("listPendingReceived", () => {
    const userId = "507f1f77bcf86cd799439011";

    it("should return pending received requests", async () => {
      const friendships = [
        {
          _id: "request1",
          requester: { _id: "user2", username: "user2" },
          recipient: { _id: userId, username: "user1" },
          status: "PENDING",
        },
      ];
      const responseData = [
        { id: "request1", fromPlayerId: "user2", username: "user2" },
      ];

      serviceMock.listPendingReceived.mockResolvedValue(friendships);
      FriendshipResponseDto.fromPendingReceivedList.mockReturnValue(
        responseData,
      );

      const req = { user: { id: userId } };

      await controller.listPendingReceived(req, res);

      expect(serviceMock.listPendingReceived).toHaveBeenCalledWith(userId);
      expect(
        FriendshipResponseDto.fromPendingReceivedList,
      ).toHaveBeenCalledWith(friendships);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(responseData);
    });

    it("should handle empty pending received list", async () => {
      serviceMock.listPendingReceived.mockResolvedValue([]);
      FriendshipResponseDto.fromPendingReceivedList.mockReturnValue([]);

      const req = { user: { id: userId } };

      await controller.listPendingReceived(req, res);

      expect(serviceMock.listPendingReceived).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("listPendingSent", () => {
    const userId = "507f1f77bcf86cd799439011";

    it("should return pending sent requests", async () => {
      const friendships = [
        {
          _id: "request1",
          requester: { _id: userId, username: "user1" },
          recipient: { _id: "user2", username: "user2" },
          status: "PENDING",
        },
      ];
      const responseData = [
        { id: "request1", toPlayerId: "user2", username: "user2" },
      ];

      serviceMock.listPendingSent.mockResolvedValue(friendships);
      FriendshipResponseDto.fromPendingSentList.mockReturnValue(responseData);

      const req = { user: { id: userId } };

      await controller.listPendingSent(req, res);

      expect(serviceMock.listPendingSent).toHaveBeenCalledWith(userId);
      expect(FriendshipResponseDto.fromPendingSentList).toHaveBeenCalledWith(
        friendships,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(responseData);
    });

    it("should handle empty pending sent list", async () => {
      serviceMock.listPendingSent.mockResolvedValue([]);
      FriendshipResponseDto.fromPendingSentList.mockReturnValue([]);

      const req = { user: { id: userId } };

      await controller.listPendingSent(req, res);

      expect(serviceMock.listPendingSent).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("sendRequest", () => {
    const userId = "507f1f77bcf86cd799439011";
    const body = { recipientId: "507f1f77bcf86cd799439012" };

    it("should send friend request successfully", async () => {
      const friendship = {
        _id: { toString: () => "new-friendship-id" },
        status: "PENDING",
      };

      serviceMock.sendRequest.mockResolvedValue(friendship);

      const req = { user: { id: userId }, body };

      await controller.sendRequest(req, res);

      expect(serviceMock.sendRequest).toHaveBeenCalledWith(userId, body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        friendshipId: "new-friendship-id",
        status: "PENDING",
      });
    });
  });

  describe("acceptRequest", () => {
    const userId = "507f1f77bcf86cd799439011";
    const friendshipId = "507f1f77bcf86cd799439013";

    it("should accept friend request successfully", async () => {
      const friendship = {
        _id: { toString: () => friendshipId },
        status: "ACCEPTED",
      };

      serviceMock.acceptRequest.mockResolvedValue(friendship);

      const req = { user: { id: userId }, params: { id: friendshipId } };

      await controller.acceptRequest(req, res);

      expect(serviceMock.acceptRequest).toHaveBeenCalledWith(
        userId,
        friendshipId,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: friendshipId,
        status: "ACCEPTED",
      });
    });
  });

  describe("rejectRequest", () => {
    const userId = "507f1f77bcf86cd799439011";
    const friendshipId = "507f1f77bcf86cd799439013";

    it("should reject friend request successfully", async () => {
      const friendship = {
        _id: { toString: () => friendshipId },
        status: "REJECTED",
      };

      serviceMock.rejectRequest.mockResolvedValue(friendship);

      const req = { user: { id: userId }, params: { id: friendshipId } };

      await controller.rejectRequest(req, res);

      expect(serviceMock.rejectRequest).toHaveBeenCalledWith(
        userId,
        friendshipId,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: friendshipId,
        status: "REJECTED",
      });
    });
  });

  describe("removeFriend", () => {
    const userId = "507f1f77bcf86cd799439011";
    const friendshipId = "507f1f77bcf86cd799439013";

    it("should remove friend successfully", async () => {
      serviceMock.removeFriend.mockResolvedValue({});

      const req = { user: { id: userId }, params: { id: friendshipId } };

      await controller.removeFriend(req, res);

      expect(serviceMock.removeFriend).toHaveBeenCalledWith(
        userId,
        friendshipId,
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith();
    });
  });

  describe("error handling", () => {
    const userId = "507f1f77bcf86cd799439011";

    it("should propagate service errors", async () => {
      const error = new Error("Service error");
      serviceMock.listFriends.mockRejectedValue(error);

      const req = { user: { id: userId } };

      await expect(controller.listFriends(req, res)).rejects.toThrow(
        "Service error",
      );
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
