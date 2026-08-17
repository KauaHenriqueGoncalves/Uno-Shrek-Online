import FriendshipRepository from "./friendship.repository.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { NotFoundError } from "../shared/errors/not-found.error.js";
import { BusinessError } from "../shared/errors/business.error.js";
import { UnauthorizedError } from "../shared/errors/unauthorized.error.js";
import { CreateFriendshipRequestDto } from "./dto/create-friendship.request.dto.js";
import { parseOrThrow } from "../shared/utils/validate.js";
import { FRIENDSHIP_STATUS } from "./friendship.schema.js";

export default class FriendshipService {
  constructor(schema, playerService) {
    this.friendshipRepository = new FriendshipRepository(schema);
    this.playerService = playerService;
    this.log = PinoGlobal.getInstance();
  }

  async sendRequest(requesterId, data) {
    const validData = parseOrThrow(CreateFriendshipRequestDto, data);
    const recipientId = validData.recipientId;
    if (recipientId === requesterId) {
      this.log.warn(
        { playerId: requesterId },
        "Attempt to friend request itself",
      );
      throw new BusinessError("You cannot send a friend request to yourself");
    }
    this.log.info(
      `Sending friend request. [requesterId=${requesterId}] [recipientId=${recipientId}]`,
    );
    await this.playerService.getById(recipientId);
    const existing = await this.friendshipRepository.getBetween(
      requesterId,
      recipientId,
    );
    if (existing) {
      if (existing.status === FRIENDSHIP_STATUS.ACCEPTED) {
        throw new BusinessError("You are already friends");
      }
      if (existing.status === FRIENDSHIP_STATUS.PENDING) {
        throw new BusinessError("Friend request already pending");
      }
      const resent = await this.friendshipRepository.update(existing._id, {
        requester: requesterId,
        recipient: recipientId,
        status: FRIENDSHIP_STATUS.PENDING,
      });
      this.log.info(
        { friendshipId: existing._id.toString() },
        "Friend request resent",
      );
      return resent;
    }

    const friendship = await this.friendshipRepository.create({
      requester: requesterId,
      recipient: recipientId,
      status: FRIENDSHIP_STATUS.PENDING,
    });
    this.log.info(
      { friendshipId: friendship._id.toString() },
      "Friend request created",
    );
    return friendship;
  }

  async acceptRequest(playerId, friendshipId) {
    const friendship = await this._getPendingOwnedByRecipient(
      playerId,
      friendshipId,
    );
    const accepted = await this.friendshipRepository.update(friendshipId, {
      status: FRIENDSHIP_STATUS.ACCEPTED,
    });
    this.log.info({ friendshipId }, "Friend request accepted");
    return accepted;
  }

  async rejectRequest(playerId, friendshipId) {
    await this._getPendingOwnedByRecipient(playerId, friendshipId);
    const rejected = await this.friendshipRepository.update(friendshipId, {
      status: FRIENDSHIP_STATUS.REJECTED,
    });
    this.log.info({ friendshipId }, "Friend request rejected");
    return rejected;
  }

  async removeFriend(playerId, friendshipId) {
    const friendship = await this.friendshipRepository.getById(friendshipId);
    if (!friendship) {
      throw new NotFoundError("Friendship not found");
    }
    const isPartOfFriendship =
      friendship.requester.toString() === playerId ||
      friendship.recipient.toString() === playerId;
    if (!isPartOfFriendship) {
      this.log.warn(
        { playerId, friendshipId },
        "Attempt to remove a friendship that isn't theirs",
      );
      throw new UnauthorizedError("You can't remove this friendship");
    }
    if (friendship.status !== FRIENDSHIP_STATUS.ACCEPTED) {
      throw new BusinessError("You are not friends");
    }
    const removed = await this.friendshipRepository.deleteById(friendshipId);
    this.log.info({ friendshipId }, "Friendship removed");
    return removed;
  }

  async listFriends(playerId) {
    this.log.debug(`Listing friends. [playerId=${playerId}]`);
    return await this.friendshipRepository.getFriends(playerId);
  }

  async listPendingReceived(playerId) {
    this.log.debug(`Listing pending received requests. [playerId=${playerId}]`);
    return await this.friendshipRepository.getPendingReceived(playerId);
  }

  async listPendingSent(playerId) {
    this.log.debug(`Listing pending sent requests. [playerId=${playerId}]`);
    return await this.friendshipRepository.getPendingSent(playerId);
  }

  /** Usado pelo módulo de sockets para validar convite de jogo entre amigos. */
  async assertAreFriends(playerAId, playerBId) {
    const friendship = await this.friendshipRepository.getBetween(
      playerAId,
      playerBId,
    );
    if (!friendship || friendship.status !== FRIENDSHIP_STATUS.ACCEPTED) {
      throw new BusinessError("You are only able to invite friends");
    }
    return friendship;
  }

  async _getPendingOwnedByRecipient(playerId, friendshipId) {
    const friendship = await this.friendshipRepository.getById(friendshipId);
    if (!friendship) {
      throw new NotFoundError("Friendship not found");
    }
    if (friendship.recipient.toString() !== playerId) {
      this.log.warn(
        { playerId, friendshipId },
        "Attempt to answer a request that isn't theirs",
      );
      throw new UnauthorizedError("You can't answer this request");
    }
    if (friendship.status !== FRIENDSHIP_STATUS.PENDING) {
      throw new BusinessError("This request is no longer pending");
    }
    return friendship;
  }
}
