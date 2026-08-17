export const onlinePlayers = new Map(); // playerId -> Set<socketId>, usado para convite do jogo e outro se possivel

export function addOnlinePlayer(playerId, socketId) {
  if (!onlinePlayers.has(playerId)) {
    onlinePlayers.set(playerId, new Set());
  }
  onlinePlayers.get(playerId).add(socketId);
}

export function removeOnlinePlayer(playerId, socketId) {
  const sockets = onlinePlayers.get(playerId);
  if (!sockets) {
    return;
  }
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlinePlayers.delete(playerId);
  }
}
