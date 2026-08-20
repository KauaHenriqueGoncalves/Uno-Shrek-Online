import { Server } from "socket.io";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import socketAuthMiddleware from "../shared/middleware/socket-auth.middleware.js";
import {
  registerGameHandlers,
  broadcastRoomGameInfo,
} from "./handlers/register-game.handlers.socket.js";
import { registerPlayerHandlers } from "./handlers/register-player.handlers.socket.js";
import { registerFriendHandlers } from "./handlers/register-friend.handlers.socket.js";
import { addOnlinePlayer } from "./handlers/online-players.handlers.js";

const log = PinoGlobal.getInstance();

export default function initSocket(httpServer, { gameService, playerService, friendshipService }) {
  const io = new Server(httpServer, {
    path: process.env.PROFILE === "prod" ? process.env.SOCKET_PATH : "",
    cors: {
      origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);
  log.info("Socket Middleware configured.");

  gameService.orchestrator.on("botTurn", (game) => {
    broadcastRoomGameInfo(io, gameService, game._id.toString()).catch((err) => {
      log.warn({ err }, "Failed to broadcast bot turn");
    });
  });

  io.on("connection", (socket) => {
    log.info(
      `Player connected web socket. [playerId=${socket.playerId}] [socketId=${socket.id}]`,
    );
    try {
      addOnlinePlayer(socket.playerId, socket.id);
      registerGameHandlers(socket, io, { gameService });
      registerPlayerHandlers(socket, io, { playerService, gameService });
      registerFriendHandlers(socket, io, { friendshipService, playerService, gameService });
    } catch (err) {
      log.warn({ err }, "socket failed to initialize");
      throw err;
    }
  });
  log.info("Connection with socket established.");
  return io;
}
