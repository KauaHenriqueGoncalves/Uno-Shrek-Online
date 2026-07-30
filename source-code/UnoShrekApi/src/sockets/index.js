import { Server } from "socket.io";
import PinoGlobal from "../config/logger/PinoGlobal.js";

const log = PinoGlobal.getInstance();

export default function initSocket(httpServer, { gameService }) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("socket conectado: " + socket.id);
    console.log("total conectados agora:", io.engine.clientsCount);

    socket.on("mensagem", ({ mensagem }) => {
      console.log("recebido:", mensagem, "de", socket.id);
      console.log("emitindo para", io.engine.clientsCount, "clientes");
      socket.broadcast.emit("mensagem", {
        from: socket.id,
        text: mensagem,
      });
    });

    socket.on("disconnect", () => {
      console.log("desconectado");
    });
  });

  return io;
}
