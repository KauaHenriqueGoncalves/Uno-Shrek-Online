import App from "../../src/app.js";

let appInstance;

export async function startTestApp() {
  if (!appInstance) {
    appInstance = new App();
    await appInstance.init();
  }
  return appInstance.express;
}

export async function stopTestApp() {
  if (appInstance) {
    await appInstance.mongo.database.connection.close();
    appInstance = undefined;
  }
}

export function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}
