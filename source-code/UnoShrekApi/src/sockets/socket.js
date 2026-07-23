import { Server } from "socket.io";
import PinoGlobal from "../config/logger/PinoGlobal.js";
import RoomService from "../service/RoomService.js";

const log = PinoGlobal.getInstance();
const roomService = new RoomService();

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    path: "/socket",
    cors: {
      origin: process.env.FRONTEND_URL ?? "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    log.info(`Client connected: ${socket.id}`);

    // Send the current room snapshot as soon as the client connects.
    socket.emit("room:list", roomService.listRooms());

    socket.on("room:join", (payload = {}, ack) => {
      try {
        const roomId = payload.roomId ?? payload.gameId;
        const room = roomService.joinRoom({
          roomId,
          socketId: socket.id,
          playerId: payload.playerId,
          username: payload.username,
          maxPlayers: payload.maxPlayers,
        });

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerId = payload.playerId ?? null;

        socket.emit("room:joined", room);
        io.to(roomId).emit("room:updated", room);

        if (typeof ack === "function") {
          ack({ ok: true, room });
        }
      } catch (error) {
        log.warn({ err: error, socketId: socket.id }, "Failed to join room");
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        } else {
          socket.emit("room:error", { message: error.message });
        }
      }
    });

    socket.on("room:leave", (payload = {}, ack) => {
      const roomId = payload.roomId ?? socket.data.roomId;
      if (!roomId) {
        const response = { ok: false, message: "roomId is required" };
        if (typeof ack === "function") {
          ack(response);
        } else {
          socket.emit("room:error", response);
        }
        return;
      }

      // Keep the socket.io room and the in-memory room state in sync.
      socket.leave(roomId);
      const room = roomService.leaveRoom({ roomId, socketId: socket.id });
      socket.data.roomId = null;

      io.to(roomId).emit("room:updated", room);

      const response = { ok: true, room };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("room:left", response);
      }
    });

    socket.on("room:message", (payload = {}, ack) => {
      const roomId = payload.roomId ?? socket.data.roomId;
      const message = payload.message ?? payload.text ?? "";

      if (!roomId) {
        const response = { ok: false, message: "roomId is required" };
        if (typeof ack === "function") {
          ack(response);
        } else {
          socket.emit("room:error", response);
        }
        return;
      }

      // Broadcast the message to everyone in the same room.
      const event = {
        roomId,
        socketId: socket.id,
        playerId: socket.data.playerId ?? null,
        message,
        timestamp: new Date().toISOString(),
      };

      io.to(roomId).emit("room:message", event);

      if (typeof ack === "function") {
        ack({ ok: true });
      }
    });

    socket.on("room:state", (payload = {}, ack) => {
      const roomId = payload.roomId ?? socket.data.roomId;
      if (!roomId) {
        const response = { ok: false, message: "roomId is required" };
        if (typeof ack === "function") {
          ack(response);
        } else {
          socket.emit("room:error", response);
        }
        return;
      }

      const room = roomService.getRoom(roomId);
      const response = { ok: true, room };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("room:state", response);
      }
    });

    socket.on("message", (data) => {
      log.info(`Test message: ${data}`);

      socket.emit("message", {
        text: "Message received!",
      });
    });

    socket.on("disconnect", () => {
      // Clean up any room membership left behind by this socket.
      const touchedRooms = roomService.removeSocket(socket.id);
      for (const roomId of touchedRooms) {
        io.to(roomId).emit("room:updated", roomService.getRoom(roomId));
      }

      log.info(`Client disconnected: ${socket.id}`);
    });
  });
}
