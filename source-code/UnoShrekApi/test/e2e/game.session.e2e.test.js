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

describe("E2E - Gerenciamento de sessão de jogo", () => {
  let app;
  let ownerAgent;
  let guestAgent;
  let gameId;
  const gamePassword = "abcd";

  beforeAll(async () => {
    app = await startTestApp();
    ownerAgent = await registerAndLogin(app, "owner");
    guestAgent = await registerAndLogin(app, "guest");
  });

  afterAll(async () => {
    await stopTestApp();
  });

  it("deve criar uma nova sala de jogo", async () => {
    const res = await ownerAgent
      .post("/api/games")
      .send({ title: "Sala E2E", password: gamePassword, maxPlayers: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("gameId");
    gameId = res.body.gameId;
  });

  it("deve permitir que outro jogador entre na sala com a senha correta", async () => {
    const res = await guestAgent
      .put("/api/games/join")
      .send({ gameId, password: gamePassword });

    expect(res.status).toBe(200);
  });

  it("não deve permitir entrar na sala com senha incorreta", async () => {
    const res = await guestAgent
      .put("/api/games/join")
      .send({ gameId, password: "senha-errada" });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("deve marcar ambos os jogadores como prontos e iniciar a partida", async () => {
    const readyOwner = await ownerAgent
      .put("/api/games/ready")
      .send({ gameId });
    const readyGuest = await guestAgent
      .put("/api/games/ready")
      .send({ gameId });
    expect(readyOwner.status).toBe(200);
    expect(readyGuest.status).toBe(200);

    const start = await ownerAgent.put("/api/games/start").send({ gameId });
    expect(start.status).toBe(200);
  });

  it("deve retornar o status da partida como ativa", async () => {
    const res = await ownerAgent.get(`/api/games/${gameId}/status`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("active");
  });

  it("deve encerrar a partida", async () => {
    const res = await ownerAgent.put("/api/games/finish").send({ gameId });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/ended/i);
  });
});
