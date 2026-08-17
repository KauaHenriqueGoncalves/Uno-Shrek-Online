export default class FriendshipResponseDto {
  static fromFriend(friendship, viewerId) {
    const isViewerRequester = friendship.requester._id.toString() === viewerId;
    const friend = isViewerRequester
      ? friendship.recipient
      : friendship.requester;
    return {
      id: friendship._id.toString(),
      friendId: friend._id.toString(),
      username: friend.username,
      picture: friend.picture,
      since: friendship.updatedAt,
    };
  }

  static fromFriendList(friendships, viewerId) {
    return friendships.map((friendship) =>
      this.fromFriend(friendship, viewerId),
    );
  }

  /** Formata um pedido pendente recebido (mostra dados de quem pediu). */
  static fromPendingReceived(friendship) {
    return {
      id: friendship._id.toString(),
      fromPlayerId: friendship.requester._id.toString(),
      username: friendship.requester.username,
      picture: friendship.requester.picture,
      createdAt: friendship.createdAt,
    };
  }

  static fromPendingReceivedList(friendships) {
    return friendships.map((friendship) =>
      this.fromPendingReceived(friendship),
    );
  }

  /** Formata um pedido pendente enviado (mostra dados de quem vai receber). */
  static fromPendingSent(friendship) {
    return {
      id: friendship._id.toString(),
      toPlayerId: friendship.recipient._id.toString(),
      username: friendship.recipient.username,
      picture: friendship.recipient.picture,
      createdAt: friendship.createdAt,
    };
  }

  static fromPendingSentList(friendships) {
    return friendships.map((friendship) => this.fromPendingSent(friendship));
  }
}
