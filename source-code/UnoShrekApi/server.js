import App from "./app.js";
import PinoGlobal from "./config/logger/PinoGlobal.js";
import { createServer } from "http";
import { initSockets } from "./sockets/socket.js";

class Server {
  constructor() {
    this.app = new App();
    this.port = process.env.API_PORT ?? 3000;
    this.log = PinoGlobal.getInstance();
  }

  async start() {
    try {
      await this.app.init();

      // Create an HTTP server wrapping Express.
      // Socket.IO will attach to this same sever, sharing port and connection.
      this.httpServer = createServer(this.app.express);

      // Boot Socket.IO server and attach to the HTTP server.
      initSockets(this.httpServer);

      this.httpServer.listen(this.port, () => {
        this.log.info(
          `Started Application - Available in host http://localhost:${this.port}`,
        );
      });
    } catch (error) {
      this.log.error({ err: error }, "Error during application startup");
      process.exit(1);
    }
  }
}

const server = new Server();
await server.start();
