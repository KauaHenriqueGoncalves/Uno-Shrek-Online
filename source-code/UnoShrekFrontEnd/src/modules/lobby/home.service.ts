import { api } from "../../shared/services/api";

export type Room = {
  id: string;
  name: string;
  players: number;
  capacity: number;
  code: string;
};

export const homeService = {
  async createRoom(data: {
    title: string;
    capacity: number;
    bots: boolean;
    botCount: number;
    password: string;
  }) {
    console.log(" Criando sala via REST:", data);

    const payload = {
      title: data.title,
      maxPlayers: data.capacity,
      password: data.password,
    };

    console.log(" Payload enviado para /api/games:", payload);

    const response = await api.post("/api/games", payload);

    console.log(" Sala criada:", response.data);

    const gameId = response.data.gameId;

    if (!gameId) {
      throw new Error("Backend não retornou gameId");
    }

    if (data.bots && data.botCount > 0) {
      console.log(
        `🤖 Adicionando ${data.botCount} bots à sala ${gameId}`,
      );

      for (let i = 0; i < data.botCount; i++) {
        await homeService.addBot(gameId);

        console.log(`🤖 Bot ${i + 1}/${data.botCount} adicionado`);
      }
    }

    return {
      ...response.data,
      gameId,
    };
  },

  async addBot(gameId: string) {
    const { data } = await api.put(
      `/api/games/${gameId}/add-bot`,
    );

    return data;
  },

  async joinById(gameId: string, password = "") {
    const { data } = await api.put("/api/games/join", {
      gameId,
      password,
    });

    return data;
  },

  async joinByCode(code: string, password = "") {
    const { data: game } = await api.get(
      `/api/games/code/${code}`,
    );

    return homeService.joinById(
      game.gameId,
      password,
    );
  },

  async listPublicRooms(): Promise<Room[]> {
    const { data } = await api.get(
      "/api/games/status/pending",
    );

    return data.map((g: any) => ({
      id: g.id,
      name: g.title,
      players: g.players?.length ?? 0,
      capacity: g.maxPlayers,
      code: g.code,
    }));
  },

  async quickJoin() {
    const { data } = await api.get(
      "/api/games/quick-join",
    );

    return data;
  },
};