export default class RoomService {
  constructor() {
    // Keeps the active rooms in memory for the socket layer.
    this.rooms = new Map();
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) ?? null;
  }

  listRooms() {
    return [...this.rooms.values()].map((room) => this.serializeRoom(room));
  }

  joinRoom({ roomId, socketId, playerId, username, maxPlayers }) {
    if (!roomId) {
      throw new Error("roomId is required");
    }

    // Create the room on demand when the first player joins.
    const room = this.rooms.get(roomId) ?? {
      roomId,
      maxPlayers: maxPlayers ?? null,
      players: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (room.maxPlayers === null && maxPlayers !== undefined) {
      room.maxPlayers = maxPlayers;
    }

    const alreadyJoined = room.players.some(
      (player) => player.socketId === socketId,
    );
    if (!alreadyJoined) {
      if (room.maxPlayers !== null && room.players.length >= room.maxPlayers) {
        throw new Error("Room is full");
      }

      room.players.push({
        socketId,
        playerId: playerId ?? null,
        username: username ?? null,
        joinedAt: new Date().toISOString(),
      });
    }

    room.updatedAt = new Date().toISOString();
    this.rooms.set(roomId, room);
    return this.serializeRoom(room);
  }

  leaveRoom({ roomId, socketId }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    room.players = room.players.filter(
      (player) => player.socketId !== socketId,
    );
    room.updatedAt = new Date().toISOString();

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    this.rooms.set(roomId, room);
    return this.serializeRoom(room);
  }

  removeSocket(socketId) {
    const touchedRooms = [];

    // Remove the socket from every room it belongs to.
    for (const [roomId, room] of this.rooms.entries()) {
      const hasSocket = room.players.some(
        (player) => player.socketId === socketId,
      );
      if (!hasSocket) {
        continue;
      }

      room.players = room.players.filter(
        (player) => player.socketId !== socketId,
      );
      room.updatedAt = new Date().toISOString();

      if (room.players.length === 0) {
        this.rooms.delete(roomId);
      } else {
        this.rooms.set(roomId, room);
      }

      touchedRooms.push(roomId);
    }

    return touchedRooms;
  }

  serializeRoom(room) {
    return {
      roomId: room.roomId,
      maxPlayers: room.maxPlayers,
      players: room.players.map((player) => ({
        socketId: player.socketId,
        playerId: player.playerId,
        username: player.username,
        joinedAt: player.joinedAt,
      })),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
