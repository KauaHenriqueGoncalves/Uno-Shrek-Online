import request from "supertest";
import { startTestApp, stopTestApp, uniqueSuffix } from "../setup/setup.app.js";

jest.setTimeout(30000);

describe("E2E - Autenticação de usuário", () => {
  let app;
  const suffix = uniqueSuffix();
  const player = {
    username: `player_${suffix}`,
    age: 25,
    email: `player_${suffix}@teste.com`,
    password: "senha123",
  };

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  it("deve registrar um novo jogador", async () => {
    const res = await request(app).post("/api/auth/register").send(player);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message");
  });

  it("não deve permitir registrar o mesmo e-mail duas vezes", async () => {
    const res = await request(app).post("/api/auth/register").send(player);
    expect(res.status).toBe(400);
  });

  it("deve autenticar com credenciais válidas e retornar um token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: player.username, password: player.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("não deve autenticar com senha inválida", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: player.username, password: "senha-errada" });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("deve encerrar a sessão (logout) de um usuário autenticado", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      username: player.username,
      password: player.password,
    });

    const res = await agent.post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logout/i);
  });
});
