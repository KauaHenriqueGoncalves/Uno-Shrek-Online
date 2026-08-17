import express from "express";
import FriendshipResponseDto from "./response/friendship.response.dto.js";
import authMiddleware from "../shared/middleware/auth.middleware.js";
import asyncHandler from "../shared/utils/async-handler.js";

export default class FriendshipController {
  constructor(service) {
    this.routers = express.Router();
    this.service = service;
    this.registerRoutes();
  }

  registerRoutes() {
    this.routers.get(
      "/",
      authMiddleware,
      asyncHandler(this.listFriends.bind(this)),
    );
    this.routers.get(
      "/requests/received",
      authMiddleware,
      asyncHandler(this.listPendingReceived.bind(this)),
    );
    this.routers.get(
      "/requests/sent",
      authMiddleware,
      asyncHandler(this.listPendingSent.bind(this)),
    );
    this.routers.post(
      "/requests",
      authMiddleware,
      asyncHandler(this.sendRequest.bind(this)),
    );
    this.routers.put(
      "/requests/:id/accept",
      authMiddleware,
      asyncHandler(this.acceptRequest.bind(this)),
    );
    this.routers.put(
      "/requests/:id/reject",
      authMiddleware,
      asyncHandler(this.rejectRequest.bind(this)),
    );
    this.routers.delete(
      "/:id",
      authMiddleware,
      asyncHandler(this.removeFriend.bind(this)),
    );
  }

  async listFriends(req, res) {
    const userId = req.user.id;
    const friendships = await this.service.listFriends(userId);
    const response = FriendshipResponseDto.fromFriendList(friendships, userId);
    return res.status(200).json(response);
  }

  async listPendingReceived(req, res) {
    const friendships = await this.service.listPendingReceived(req.user.id);
    const response = FriendshipResponseDto.fromPendingReceivedList(friendships);
    return res.status(200).json(response);
  }

  async listPendingSent(req, res) {
    const friendships = await this.service.listPendingSent(req.user.id);
    const response = FriendshipResponseDto.fromPendingSentList(friendships);
    return res.status(200).json(response);
  }

  async sendRequest(req, res) {
    const friendship = await this.service.sendRequest(req.user.id, req.body);
    return res.status(201).json({
      friendshipId: friendship._id.toString(),
      status: friendship.status,
    });
  }

  async acceptRequest(req, res) {
    const friendship = await this.service.acceptRequest(
      req.user.id,
      req.params.id,
    );
    return res.status(200).json({
      id: friendship._id.toString(),
      status: friendship.status,
    });
  }

  async rejectRequest(req, res) {
    const friendship = await this.service.rejectRequest(
      req.user.id,
      req.params.id,
    );
    return res.status(200).json({
      id: friendship._id.toString(),
      status: friendship.status,
    });
  }

  async removeFriend(req, res) {
    await this.service.removeFriend(req.user.id, req.params.id);
    return res.status(204).json();
  }
}
