import pino from "pino";

export default class PinoGlobal {
  static instance = null;

  static getInstance() {
    if (this.instance == null) {
      this.instance = pino({
        transport: {
          target: "pino-pretty",
        },
      });
    }
    return this.instance;
  }
}
