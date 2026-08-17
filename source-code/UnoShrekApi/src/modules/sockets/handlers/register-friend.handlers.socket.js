import PinoGlobal from "../../shared/logger/pino-global.logger.js";
import FRIEND_EVENTS from "../events/friend.events.js";
import { onlinePlayers } from "./online-players.handlers.js";

const log = PinoGlobal.getInstance();

export function registerFriendHandlers(socket, io, { friendshipService, playerService }) {
  socket.on(FRIEND_EVENTS.INPUT.INVITE_TO_GAME, async ({ friendId }) => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Player inviting friend to game. [playerId=${userId}] [friendId=${friendId}] [socketId=${socket.id}]`,
      );
      if (!gameId) {
        throw Error("You need to be in a game to invite a friend");
      }
      await friendshipService.assertAreFriends(userId, friendId);
      const friendSocketIds = onlinePlayers.get(friendId);
      if (!friendSocketIds || friendSocketIds.size === 0) {
        socket.emit(FRIEND_EVENTS.OUTPUT.ERROR, { message: "Friend is offline" });
        return;
      }
      const player = await playerService.getById(userId);
      const payload = {
        fromPlayerId: userId,
        fromUsername: player.username,
        gameId,
      };
      for (const friendSocketId of friendSocketIds) {
        io.to(friendSocketId).emit(FRIEND_EVENTS.OUTPUT.GAME_INVITE_RECEIVED, payload);
      }
      log.info(
        `Game invite sent to friend. [playerId=${userId}] [friendId=${friendId}] [gameId=${gameId}]`,
      );
      socket.emit(FRIEND_EVENTS.OUTPUT.INVITE_SENT, { friendId, gameId });
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(FRIEND_EVENTS.OUTPUT.ERROR, { message: err.message });
    }
  });
}
