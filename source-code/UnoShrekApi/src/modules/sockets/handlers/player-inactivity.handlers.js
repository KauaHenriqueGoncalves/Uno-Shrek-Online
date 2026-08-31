import PinoGlobal from "../../shared/logger/pino-global.logger.js";

const log = PinoGlobal.getInstance();

const disconnectTimers = new Map();

const DISCONNECT_TIMEOUT = 60000;

function getTimerKey(gameId, playerId) {
  return `${gameId}:${playerId}`;
}

export function startDisconnectTimer(gameId, playerId, callback) {
  const key = getTimerKey(gameId, playerId);

  if (disconnectTimers.has(key)) {
    clearTimeout(disconnectTimers.get(key));
  }

  log.info(
    `Starting disconnect timer. [playerId=${playerId}] [gameId=${gameId}] [timeout=${DISCONNECT_TIMEOUT}ms]`,
  );

  const timer = setTimeout(async () => {
    try {
      log.info(
        `Disconnect timeout reached. [playerId=${playerId}] [gameId=${gameId}]`,
      );

      await callback();
    } catch (err) {
      log.warn(
        { err },
        `Failed to process disconnect timeout. [playerId=${playerId}] [gameId=${gameId}]`,
      );
    } finally {
      disconnectTimers.delete(key);
    }
  }, DISCONNECT_TIMEOUT);

  disconnectTimers.set(key, timer);
}

export function cancelDisconnectTimer(gameId, playerId) {
  const key = getTimerKey(gameId, playerId);
  const timer = disconnectTimers.get(key);

  if (!timer) return;

  clearTimeout(timer);
  disconnectTimers.delete(key);

  log.info(
    `Disconnect timer cancelled. [playerId=${playerId}] [gameId=${gameId}]`,
  );
}