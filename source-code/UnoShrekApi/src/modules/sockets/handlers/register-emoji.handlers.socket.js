import PinoGlobal from "../../../modules/shared/logger/pino-global.logger.js";
import EMOJI_EVENTS from "../events/emoji.event.js";
import { getEmojiByKey } from "./emoji.handlers.js";

const log = PinoGlobal.getInstance();

export function registerEmojiHandlers(socket, io) {
  socket.on(EMOJI_EVENTS.INPUT.SEND_EMOJI, ({ key }) => {
    try {
      const userId = socket.playerId;
      const gameId = socket.currentGameId;
      log.info(
        `Owner click to finesh a game on socket. [socketId=${socket.id}] [playerId=${userId}] [socketId=${socket.id}]`,
      );
      if (!gameId) {
        throw Error("Dont have a current game");
      }
      log.info(
        `Received emoji event from socket ${socket.id}: ${JSON.stringify({ key })}`,
      );
      const emoji = getEmojiByKey(key);
      log.info(
        `Emoji with key ${key} is ${emoji}. Broadcasting to other clients.`,
      );
      io.to(gameId).emit(EMOJI_EVENTS.OUTPUT.EMOJI_SENT, {
        key,
        emoji,
        playerId: userId,
      });
    } catch (err) {
      log.warn({ err }, "socket failed");
      socket.emit(EMOJI_EVENTS.OUTPUT.EMOJI_ERROR, { message: err.message });
    }
  });
}
