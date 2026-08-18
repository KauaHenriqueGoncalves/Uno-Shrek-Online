import { api } from "../../shared/services/api";

export type Room = {
  id: string;
  name: string;
  players: number;
  capacity: number;
  code: string;
};

export const homeService = {
  // Criar sala + adicionar bots
  async createRoom(data: {
    capacity: number;
    bots: boolean;
    botCount: number;
    password: string;
  }) {
    const { data: game } = await api.post("/api/games", {
      title: "Sala de URRO",
      maxPlayers: data.capacity,
      password: data.password,
    });

    if (data.bots) {
      for (let i = 0; i < data.botCount; i++) {
        await api.put(`/api/games/${game.gameId}/add-bot`);
      }
    }

    return game;
  },

  // Entrar por gameId
  async joinById(gameId: string, password = "") {
    const { data } = await api.put("/api/games/join", { gameId, password });
    return data;
  },

  // Buscar por código curto e entrar
  async joinByCode(code: string, password = "") {
    const { data: game } = await api.get(`/api/games/code/${code}`);
    return await homeService.joinById(game.gameId, password);
  },

  // Listar salas públicas pendentes
  async listPublicRooms(): Promise<Room[]> {
    const { data } = await api.get("/api/games/status/pending");
    return data.map((g: any) => ({
      id: g.id,
      name: g.title,
      players: g.players?.length ?? 0,
      capacity: g.maxPlayers,
      code: g.code,
    }));
  },

  // Partida rápida
  async quickJoin() {
    const { data } = await api.get("/api/games/quick-join");
    return data;
  },
};