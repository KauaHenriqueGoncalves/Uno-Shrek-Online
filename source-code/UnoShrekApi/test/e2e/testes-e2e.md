# Testes End-to-End (E2E)

## Objetivo

Validar, por meio de requisições HTTP reais feitas com `supertest` sobre a
aplicação Express (`src/app.js`), os principais fluxos de uso do UnoShrekApi
de ponta a ponta: da autenticação até o encerramento de uma partida.

## Como executar

1. Suba a infraestrutura local (MongoDB) via Docker Compose:
   ```
   docker compose up -d mongo
   ```
2. Garanta que o `.env` da API aponta para esse Mongo (`MONGODB_HOST`,
   `MONGODB_USER`, etc.).
3. Rode os testes E2E:
   ```
   node --env-file=.env node_modules/jest/bin/jest.js test/e2e --runInBand
   ```
   ```
   "test::e2e": "node --env-file=.env node_modules/jest/bin/jest.js test/e2e --verbose --runInBand"
   ```
   O `--runInBand` evita que suítes concorrentes disputem o mesmo banco e a
   mesma instância da aplicação.

Os testes usam dados únicos por execução (`uniqueSuffix`) para não colidir
com o índice `unique` de `username`/`email`.

## Casos de uso cobertos

| #   | Arquivo                    | Caso de uso                                                                                                          | Endpoints envolvidos                                                                                                                                           |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `auth.e2e.test.js`         | Registro, login, login inválido e logout de jogador                                                                  | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`                                                                                     |
| 2   | `game-session.e2e.test.js` | Criação de sala, entrada de um segundo jogador, prontidão, início e encerramento da partida                          | `POST /api/games`, `PUT /api/games/join`, `PUT /api/games/ready`, `PUT /api/games/start`, `GET /api/games/:id/status`, `PUT /api/games/finish`                 |
| 3   | `game-play.e2e.test.js`    | Consulta da carta do topo, do jogador da vez, compra de carta e tentativa de jogar carta inválida                    | `GET /api/games/:id/top-card`, `GET /api/games/:id/current-player`, `PUT /api/games/:id/draw`, `PUT /api/games/:id/play`, `GET /api/games/:id/current-players` |
| 4   | `friendship.e2e.test.js`   | Envio, listagem e aceite de pedido de amizade entre dois jogadores                                                   | `POST /api/friends/requests`, `GET /api/friends/requests/received`, `PUT /api/friends/requests/:id/accept`, `GET /api/friends`                                 |
| 5   | `game-play`                | Regras de negócio: senha incorreta ao entrar na sala, carta inexistente na jogada, acesso de jogador fora da partida | validações de status HTTP (`4xx`) em cada cenário negativo                                                                                                     |

Cada suíte valida: código de status HTTP, formato do corpo da resposta e,
quando aplicável, efeitos colaterais (ex.: jogo passa a existir e pode ser
consultado após a criação; pedido de amizade aparece na lista do
destinatário; partida muda de status para `active` após o start).
