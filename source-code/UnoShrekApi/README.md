# UnoShrek API

- [Postman Documentation](https://documenter.getpostman.com/view/57499632/2sBYAuSWok)

A digital version of the **UNO** card game, developed in **Node.js**, allowing multiple players to join real-time game sessions and play against each other following UNO rules.

The backend follows a **modular monolith architecture**, organized by domain (`src/modules/`), using **Express** for the HTTP layer, **Socket.io** for real-time communication, and **MongoDB/Mongoose** for persistence (ORM/ODM).

## Table of Contents

- [About the project](#about-the-project)
- [Architecture](#architecture)
- [Technologies used](#technologies-used)
- [Folder structure](#Folder-structure-example)
- [Prerequisites](#prerequisites)
- [Environment setup](#environment-setup)
- [Starting the database (MongoDB)](#starting-the-database-mongodb)
- [Installing dependencies](#installing-dependencies)
- [Running the project](#running-the-project)
- [Tests](#tests)
- [API Endpoints](#api-endpoints)
- [Real-time communication (Socket.io)](#real-time-communication-socketio)
- [Error handling](#error-handling)
- [Authors](#authors)

## About the project

The goal is to provide a REST + real-time API that powers a digital version of UNO, enabling:

1. Player **authentication** via JWT (HTTP-only cookies).
2. **Player** management (full CRUD).
3. **Game/match** management, including the UNO rules engine (starting a match, playing a card, drawing a card, etc.). 4. Manage the deck's **cards**.
5. Manage **friendships** between players.
6. Maintain a **history** of matches and **scores**.
7. Synchronize game state across players in real-time via **Socket.io**.

## Architecture

The project is organized as a **modular monolith**: each game domain resides in its own module within `src/modules/`, featuring its own internal layers:

- **Controller**: receives HTTP requests, delegates to the service layer, and returns responses.
- **Service**: handles validations, business rules, and orchestration.
- **Repository/Schema**: abstracts MongoDB access via Mongoose.
- **DTOs**: request DTOs (validation using **Zod**) and response DTOs (output formatting/normalization).

Architectural highlights:

- **`GameOrchestrator`** coordinates game business transactions (start, draw, play), receiving repositories/schemas via dependency injection (`App.dependencies()`).
- **"Two worlds" pattern**: the Mongoose document state and the raw state of the game engine are kept separate, with adapter methods (`_toEngineState` / `_applyEngineStateToGame`) bridging the two.
- **`modules/sockets/`** mirrors HTTP layer patterns: handlers serve as lightweight entry points that call services, containing no business logic.
- **`modules/shared/`** centralizes cross-cutting infrastructure: MongoDB connection, logger (Pino), middlewares (auth, cache, error handler), and custom exceptions.

## Technologies used

- [Node.js](https://nodejs.org/) (ES modules and `--env-file`)
- [Express](https://expressjs.com/) 5: HTTP framework
- [Socket.io](https://socket.io/): real-time communication
- [Mongoose](https://mongoosejs.com/): ORM/ODM for MongoDB
- [MongoDB](https://www.mongodb.com/): document database
- [Zod](https://zod.dev/): schema validation (DTOs)
- [JWT](https://github.com/auth0/node-jsonwebtoken) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js): authentication and password hashing
- [Morgan](https://github.com/expressjs/morgan): HTTP request logging
- [Pino](https://getpino.io/) / Pino-Pretty: structured application logging
- [Cors](https://github.com/expressjs/cors): CORS configuration
- [Jest](https://jestjs.io/) + [Babel](https://babeljs.io/) + [Supertest](https://github.com/ladjs/supertest): unit and E2E testing
- [Docker Compose](https://docs.docker.com/compose/): local database orchestration

## Folder structure example

```
source-code/
├── UnoShrekApi/                 # REST API + Socket.io (backend)
│   ├── app.js                   # Main Express application configuration
│   ├── server.js                # Entry point (HTTP server + Socket.io)
│   ├── jsconfig.json            # Type support via JSDoc
│   ├── env.exemple              # Environment variable template
│   ├── package.json
│   └── src/
│       └── modules/
│           ├── auth/            # Login, JWT, and authentication
│           ├── player/          # Player CRUD
│           ├── game/            # Game sessions + UNO rules engine
│
``` ├── card/            # Deck and cards
│           ├── score/           # Player scores
│           ├── friendship/      # Friendship system
│           ├── history/         # Match history
│           ├── health/          # Health check
│           ├── sockets/         # Socket.io handlers and events
│           └── shared/          # Mongo, logger, middlewares, and exceptions
├── UnoShrekFrontEnd/             # Frontend (React + Vite + TanStack Router)
└── docker-compose.yaml          # Launches MongoDB locally via Docker
```

## Prerequisites

- [Node.js](https://nodejs.org/) version **20.6+** (required for the `--env-file` flag)
- [Docker](https://www.docker.com/) and Docker Compose, **or** an existing MongoDB instance (local or remote)

## Environment configuration

The project loads environment variables from a `.env` file using Node.js's native loading mechanism (`--env-file`). A template is available at `UnoShrekApi/env.exemple`.

Create a `.env` file inside `UnoShrekApi/` with the following content, adjusting the values ​​to suit your environment:

```dotenv
API_PORT=3000
MONGODB_USER=admin
MONGODB_PASSWORD=admin123
MONGODB_HOST=localhost (or container)
MONGODB_PORT=27017
MONGODB_NAME=UnoShrekDb
JWT_SECRET=replace-with-a-strong-secret
FRONTEND_URL=http://localhost:5173
```

> `API_PORT` must be between `3000` and `3099` (default: `3000`). `MONGODB_PORT` must be between `27000` and `27090` (default: `27017`).

## Upgrading the database (MongoDB)

The repository includes a `docker-compose.yaml` in the root of `source-code/` with a pre-configured MongoDB service (user `admin`, password `admin123`, database `UnoShrekDb`).

In the `source-code/` root, run:

```bash
docker compose up mongodb -d
```

This powers MongoDB on port `27017`, with persistent volumes for data and configurations.

## Installing dependencies

Inside the `UnoShrekApi/` folder, run:

```bash
cd UnoShrekApi
npm install
```

## Running the project

Still inside `UnoShrekApi/`, with `.env` configured and MongoDB running:

```bash
# simple production/execution
npm run start

# development, with automatic restart (nodemon)
npm run start::watch
```

The API will be available at `http://localhost:{API_PORT}` (by default, `http://localhost:3000`).

To check if the API is live, use the health check endpoint:

```bash
curl http://localhost:3000/api/health
```

## Tests

The project uses **Jest** (with Babel to support `jest.mock()` in ESM) and **Supertest** for integration testing.

```bash
# unit tests of modules
npm run test

# end-to-end testing (auth, game sessions, gameplay, friendships, errors)
npm run test::e2e

# unit tests with coverage report
npm run test::coverage
```

> On Windows, if the `test::e2e` script fails to find the Jest binary, it is already configured to point directly to `node_modules/jest/bin/jest.js`.

## API endpoints

Routes assembled in `app.js`, all under the `/api` prefix:

| Prefix | Module | Responsibility |
|-------------------|--------------|-----------------------------------------------------|
| `/api/health` | health | Application health check |
| `/api/auth` | auth | Login, logout and JWT token issuance/renewal |
| `/api/players` | player | Player CRUD |
| `/api/games` | game | Game sessions and match actions (play, buy…) |
| `/api/cards` | card | Deck card consultation and management |
| `/api/scores` | score | Player scores per match |
| `/api/friends` | friendship | Sending, accepting and listing friends |
| `/api/history` | history | History of games played |

Details of each route, payloads and response examples are in [Postman documentation](https://documenter.getpostman.com/view/46440768/2sBY4Qreda).

## Real-time communication (Socket.io)

The HTTP server (`server.js`) initializes Socket.io sharing the same services as the REST layer (`modules/sockets/socket.js`). Socket handlers are responsible for:

- Synchronize player entry/exit in a game room (`socket.join` + `currentGameId` control).
- Propagate play events (card played, card draw, turn change) to all session participants.

## Error handling

The API centralizes error handling in a global middleware (`modules/shared/middleware/error-handler.middleware.js`), which standardizes error responses:

```json
{ 
"status": "error", 
"message": "Error description", 
"timestamp": "2026-07-18T12:00:00.000Z"
}
```

Business errors (`NotFoundError`, `BusinessError`, `IlegalInputError`, `DatabaseConnectionError`, etc.) return the appropriate HTTP code; unmapped errors return `500 Internal Server Error`.