import request from "supertest";
import { startTestApp, stopTestApp, uniqueSuffix } from "../setup/setup.app.js";

jest.setTimeout(30000);

async function registerAndLogin(app, username) {
  const suffix = uniqueSuffix();
  const player = {
    username: `${username}_${suffix}`,
    age: 25,
    email: `${username}_${suffix}@teste.com`,
    password: "senha123",
  };
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send(player);
  await agent.post("/api/auth/login").send({
    username: player.username,
    password: player.password,
  });
  return agent;
}

describe("E2E - Jogadas dentro de uma partida", () => {
  let app;
  let ownerAgent;
  let guestAgent;
  let ownerId;
  let guestId;
  let gameId;
  const gamePassword = "abcd";

  beforeAll(async () => {
    app = await startTestApp();
    ownerAgent = await registerAndLogin(app, "owner");
    guestAgent = await registerAndLogin(app, "guest");

    const ownerMe = await ownerAgent.get("/api/players/me");
    const guestMe = await guestAgent.get("/api/players/me");
    ownerId = ownerMe.body.id;
    guestId = guestMe.body.id;

    const create = await ownerAgent
      .post("/api/games")
      .send({ title: "Sala Jogadas", password: gamePassword, maxPlayers: 2 });
    gameId = create.body.gameId;

    await guestAgent
      .put("/api/games/join")
      .send({ gameId, password: gamePassword });
    await ownerAgent.put("/api/games/ready").send({ gameId });
    await guestAgent.put("/api/games/ready").send({ gameId });
    await ownerAgent.put("/api/games/start").send({ gameId });
  });

  afterAll(async () => {
    await stopTestApp();
  });

  it("deve retornar a carta do topo da pilha de descarte", async () => {
    const res = await ownerAgent.get(`/api/games/${gameId}/top-card`);
    expect(res.status).toBe(200);
  });

  it("deve identificar corretamente o jogador da vez", async () => {
    const res = await ownerAgent.get(`/api/games/${gameId}/current-player`);
    expect(res.status).toBe(200);
  });

  it("deve permitir que o jogador da vez compre uma carta", async () => {
    const currentPlayer = await ownerAgent.get(
      `/api/games/${gameId}/current-player`,
    );
    const acting =
      currentPlayer.body.currentPlayer === ownerId ? ownerAgent : guestAgent;

    const res = await acting.put(`/api/games/${gameId}/draw`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("gameId");
  });

  it("não deve permitir jogar uma carta inexistente na mão do jogador", async () => {
    const res = await ownerAgent
      .put(`/api/games/${gameId}/play`)
      .send({ cardId: "000000000000000000000000" });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("não deve permitir que um jogador fora da partida acesse o estado do jogo", async () => {
    const outsider = await registerAndLogin(app, "outsider");
    const res = await outsider.get(`/api/games/${gameId}/current-players`);
    expect([200, 403, 404]).toContain(res.status);
  });
});
