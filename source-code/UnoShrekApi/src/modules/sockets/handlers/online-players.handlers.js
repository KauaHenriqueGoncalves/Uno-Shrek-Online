import PinoGlobal from "../../shared/logger/pino-global.logger.js";

const log = PinoGlobal.getInstance();

export const onlinePlayers = new Map(); // playerId -> Set<socketId>, usado para convite do jogo e outro se possivel

export function addOnlinePlayer(playerId, socketId) {
  log.info(`Seting player on list of onlinePlayers. [playerId=${playerId}] [socket=${socketId}]`);
  if (!onlinePlayers.has(playerId)) {
    log.warn(`Player already on game. [playerId=${playerId}] [socket=${socketId}]`);
    onlinePlayers.set(playerId, new Set());
  }
  onlinePlayers.get(playerId).add(socketId);
}

export function removeOnlinePlayer(playerId, socketId) {
  log.info(`Removing player on list of onlinePlayers. [playerId=${playerId}] [socket=${socketId}]`);
  const sockets = onlinePlayers.get(playerId);
  if (!sockets) {
    log.warn("player isn't online. [playerId=${playerId}] [socket=${socketId}]");
    return;
  }
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlinePlayers.delete(playerId);
  }
  log.info(`Player removed on list of onlinePlayers success. [playerId=${playerId}] [socket=${socketId}]`);
}
