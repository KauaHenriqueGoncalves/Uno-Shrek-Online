import { Server } from "socket.io";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import socketAuthMiddleware from "../shared/middleware/socket-auth.middleware.js";
import registerGameHandlers from "./handlers/register-game.handlers.js";
import registerPlayerHandlers from "./handlers/register-player.handlers.js";

const log = PinoGlobal.getInstance();

export default function initSocket(httpServer, { gameService, playerService }) {
  const io = new Server(httpServer, {
    path: process.env.PROFILE === "prod" ? process.env.SOCKET_PATH : "",
    cors: {
      origin: process.env.FRONTEND_URL ?? "*",
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);
  log.info("Socket Middleware configured.");

  io.on("connection", (socket) => {
    log.info(
      `Player connected web socket. [playerId=${socket.playerId}] [socketId=${socket.id}]`,
    );
    try {
      registerGameHandlers(socket, io, { gameService });
      registerPlayerHandlers(socket, io, { playerService, gameService });
    } catch (err) {
      log.warn({ err }, "socket failed to initialize");
      throw err;
    }
  });

  log.info("Connection with socket established.");
  return io;
}
