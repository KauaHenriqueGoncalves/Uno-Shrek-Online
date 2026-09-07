import CrudRepository from "../shared/repository/crud.repository.js";
import { FRIENDSHIP_STATUS } from "./friendship.schema.js";

export default class FriendshipRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  /** Busca a relação entre dois players, em qualquer direção. */
  async getBetween(playerAId, playerBId, session = null) {
    return await this.schema
      .findOne({
        $or: [
          { requester: playerAId, recipient: playerBId },
          { requester: playerBId, recipient: playerAId },
        ],
      })
      .session(session);
  }

  async getFriends(playerId, session = null) {
    return await this.schema
      .find({
        status: FRIENDSHIP_STATUS.ACCEPTED,
        $or: [{ requester: playerId }, { recipient: playerId }],
      })
      .populate("requester")
      .populate("recipient")
      .session(session);
  }

  async getPendingReceived(playerId, session = null) {
    return await this.schema
      .find({ recipient: playerId, status: FRIENDSHIP_STATUS.PENDING })
      .populate("requester")
      .session(session);
  }

  async getPendingSent(playerId, session = null) {
    return await this.schema
      .find({ requester: playerId, status: FRIENDSHIP_STATUS.PENDING })
      .populate("recipient")
      .session(session);
  }
}
