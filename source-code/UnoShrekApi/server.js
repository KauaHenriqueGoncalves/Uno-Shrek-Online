import App from "./app.js";
import PinoGlobal from "./config/logger/PinoGlobal.js";

class Server {
  constructor() {
    this.app = new App();
    this.port = process.env.API_PORT;
    this.log = PinoGlobal.getInstance();
  }

  async start() {
    try {
      await this.app.init();
      this.app.express.listen(this.port, () => {
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
