import { Server } from "socket.io";
import PinoGlobal from "../config/logger/PinoGlobal.js";

const log = PinoGlobal.getInstance();

export function initSockets(httpServer) {
  const io = new Server(httpServer, { path: "/socket" });
  io.on("connection", (socket) => {
    log.info(`Client connected: ${socket.id}`);

    socket.on("message", (data) => {
      log.info(`Test message: ${data}`);

      socket.emit("message", {
        text: "Message received!",
      });
    });

    socket.on("disconnect", () => {
      log.info(`Client disconnected: ${socket.id}`);
    });
  });
}
