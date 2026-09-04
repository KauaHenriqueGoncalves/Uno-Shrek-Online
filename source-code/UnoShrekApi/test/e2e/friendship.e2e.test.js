import request from "supertest";
import { startTestApp, stopTestApp, uniqueSuffix } from "../setup/setup.app.js";

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
  const login = await agent.post("/api/auth/login").send({
    username: player.username,
    password: player.password,
  });
  return { agent, playerId: login.body.player_id };
}

async function getMyId(agent) {
  const res = await agent.get("/api/players/me");
  return res.body.id ?? res.body._id;
}

describe("E2E - Fluxo de amizades", () => {
  let app;
  let userA, userB;
  let requestId;

  beforeAll(async () => {
    app = await startTestApp();
    userA = await registerAndLogin(app, "userA");
    userB = await registerAndLogin(app, "userB");
  });

  afterAll(async () => {
    await stopTestApp();
  });

  it("deve enviar um pedido de amizade de A para B", async () => {
    const idB = await getMyId(userB.agent);
    const res = await userA.agent
      .post("/api/friends/requests")
      .send({ recipientId: idB });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("friendshipId");
    requestId = res.body.friendshipId;
  });

  it("deve listar o pedido pendente recebido por B", async () => {
    const res = await userB.agent.get("/api/friends/requests/received");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("deve listar A na lista de amigos de B", async () => {
    const res = await userB.agent.get("/api/friends");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
