# UnoShrek API

Versão digital do jogo de cartas **UNO**, desenvolvida em **Node.js**, que permite que múltiplos jogadores participem de uma sessão de jogo e joguem entre si seguindo as regras do UNO.

O backend é construído em uma **arquitetura em três camadas** (apresentação, lógica de negócio e acesso a dados), utilizando **Express** para a camada HTTP e **MongoDB/Mongoose** como ORM/ODM de persistência.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Subindo o banco de dados (MongoDB)](#subindo-o-banco-de-dados-mongodb)
- [Instalando dependências](#instalando-dependências)
- [Executando o projeto](#executando-o-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Tratamento de erros](#tratamento-de-erros)
- [Coleção do Postman](#coleção-do-postman)
- [Status de implementação](#status-de-implementação)
- [Autores](#autores)

## Sobre o projeto

O objetivo é oferecer uma API REST que sustente uma versão digital do UNO, permitindo:

1. Gerenciar **jogadores** (CRUD completo).
2. Gerenciar **jogos/partidas** (CRUD completo).
3. Gerenciar as **cartas** do baralho, que devem ser inicializadas/criadas automaticamente na primeira execução (CRUD completo).
4. Gerenciar o **histórico de pontuações** dos jogadores (CRUD completo).

## Arquitetura

O projeto segue uma **arquitetura em três camadas**, mantendo cada responsabilidade isolada e modularizada:

- **Apresentação (`controller/`)** — recebe as requisições HTTP, delega para a camada de serviço e devolve as respostas.
- **Lógica de negócio (`service/`)** — validações, regras do jogo e orquestração entre as demais camadas.
- **Acesso a dados (`repository/` e `schema/`)** — abstrai o acesso ao banco de dados através do ORM (Mongoose), com um `CrudRepository` genérico reaproveitado pelos repositórios específicos.

Camadas auxiliares:

- **`dtos/`** — validação e formatação de entrada/saída usando **Zod** (request DTOs validam o payload recebido; response DTOs padronizam o retorno da API).
- **`config/`** — configuração de banco de dados, logger, middlewares e exceções customizadas da aplicação.

## Tecnologias utilizadas

- [Node.js](https://nodejs.org/) (uso de módulos ES e `--env-file`)
- [Express](https://expressjs.com/) — framework HTTP
- [Mongoose](https://mongoosejs.com/) — ORM/ODM para MongoDB
- [MongoDB](https://www.mongodb.com/) — banco de dados de documentos
- [Zod](https://zod.dev/) — validação de schemas (DTOs)
- [Morgan](https://github.com/expressjs/morgan) — logging de requisições HTTP
- [Pino](https://getpino.io/) / Pino-Pretty — logging estruturado da aplicação
- [Docker Compose](https://docs.docker.com/compose/) — orquestração do banco de dados em ambiente local

## Estrutura de pastas

```
source-code/
├── UnoShrekApi/              # API REST (backend)
│   ├── app.js                 # Configuração principal da aplicação Express
│   ├── server.js              # Ponto de entrada da aplicação
│   ├── config/
│   │   ├── database/          # Conexão com o MongoDB
│   │   ├── exceptions/        # Exceções customizadas (AppError, NotFoundError, etc.)
│   │   ├── logger/            # Configuração do Pino
│   │   ├── middleware/        # Middlewares (ex: tratamento global de erros)
│   │   └── utils/             # Utilitários (ex: parse/validação com Zod)
│   ├── controller/            # Camada de apresentação (rotas Express)
│   ├── service/                # Camada de regras de negócio
│   ├── repository/            # Camada de acesso a dados (Mongoose)
│   ├── schema/                # Modelos/Schemas do MongoDB
│   ├── dtos/
│   │   ├── request/            # DTOs de entrada (validação com Zod)
│   │   └── response/           # DTOs de saída (formatação da resposta)
│   ├── env.exemple             # Modelo de variáveis de ambiente
│   └── package.json
├── UnoShrekFrontEnd/          # Reservado para o frontend (ainda não implementado)
└── docker-compose.yaml        # Sobe o MongoDB localmente via Docker
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) versão **20.6+** (necessária para o uso da flag `--env-file`)
- [Docker](https://www.docker.com/) e Docker Compose (para subir o MongoDB localmente), **ou** uma instância de MongoDB já disponível (local ou remota)

## Configuração do ambiente

O projeto carrega variáveis de ambiente a partir de um arquivo `.env`, usando o carregamento nativo do Node.js (`--env-file`). Um modelo está disponível em `UnoShrekApi/env.exemple`.

Crie um arquivo `.env` dentro de `UnoShrekApi/` com o seguinte conteúdo, ajustando os valores conforme o seu ambiente:

```dotenv
API_PORT=3000
MONGODB_USER=admin
MONGODB_PASSWORD=admin123
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_NAME=UnoShrekDb
```

> `API_PORT` deve estar entre `3000` e `3099` (padrão: `3000`). `MONGODB_PORT` deve estar entre `27000` e `27090` (padrão: `27017`).

## Subindo o banco de dados (MongoDB)

O repositório já inclui um `docker-compose.yaml` na raiz de `source-code/` com um serviço MongoDB pré-configurado (usuário `admin`, senha `admin123`, banco `UnoShrekDb`).

Na raiz `source-code/`, execute:

```bash
docker compose up mongodb -d
```

Isso sobe o MongoDB na porta `27017`, com volumes persistentes para os dados e configurações.

## Instalando dependências

Dentro da pasta `UnoShrekApi/`, execute:

```bash
cd UnoShrekApi
npm install
```

## Executando o projeto

Ainda dentro de `UnoShrekApi/`, com o `.env` configurado e o MongoDB em execução, inicie a aplicação com:

```bash
npm run start
```

A API ficará disponível em `http://localhost:{API_PORT}` (por padrão, `http://localhost:3000`).

Para verificar se a API está no ar, use o endpoint de health check:

```bash
curl http://localhost:3000/api/health
```

## Endpoints da API

Todas as rotas abaixo têm como prefixo `http://localhost:{API_PORT}`.

### Health Check

| Método | Rota          | Descrição                     |
|--------|---------------|--------------------------------|
| GET    | `/api/health` | Verifica se a API está no ar   |

### Jogadores (`/api/players`)

| Método | Rota                | Descrição                        |
|--------|---------------------|------------------------------------|
| GET    | `/api/players`      | Lista todos os jogadores          |
| GET    | `/api/players/:id`  | Busca um jogador pelo ID          |
| POST   | `/api/players`      | Cria um novo jogador              |
| PUT    | `/api/players/:id`  | Atualiza os dados de um jogador   |
| DELETE | `/api/players/:id`  | Remove um jogador                 |

**Exemplo de requisição — `POST /api/players`**

```json
{
  "name": "João Silva",
  "age": 25,
  "email": "joao.silva@email.com"
}
```

**Exemplo de resposta (201 Created)**

```json
{
  "id": "65432abc1234def567890ab",
  "name": "João Silva",
  "age": 25,
  "email": "joao.silva@email.com",
  "createdAt": "2026-07-18T12:00:00.000Z"
}
```

### Jogos (`/api/games`)

| Método | Rota              | Descrição                    |
|--------|-------------------|-------------------------------|
| GET    | `/api/games/:id`  | Busca um jogo pelo ID         |
| POST   | `/api/games`      | Cria um novo jogo             |
| PUT    | `/api/games/:id`  | Atualiza os dados de um jogo  |
| DELETE | `/api/games/:id`  | Remove um jogo                |

> ⚠️ Endpoints planejados na especificação do projeto — implementação em andamento (ver [Status de implementação](#status-de-implementação)).

### Cartas (`/api/cards`)

| Método | Rota              | Descrição                                              |
|--------|-------------------|----------------------------------------------------------|
| GET    | `/api/cards/:id`  | Busca uma carta pelo ID                                  |
| POST   | `/api/cards`      | Cria uma carta (o baralho é inicializado automaticamente na primeira execução) |
| PUT    | `/api/cards/:id`  | Atualiza os dados de uma carta                            |
| DELETE | `/api/cards/:id`  | Remove uma carta                                          |

> ⚠️ Endpoints planejados na especificação do projeto — implementação em andamento (ver [Status de implementação](#status-de-implementação)).

### Histórico de pontuações (`/api/scores`)

| Método | Rota               | Descrição                              |
|--------|--------------------|------------------------------------------|
| GET    | `/api/scores/:id`  | Busca um registro de pontuação pelo ID  |
| POST   | `/api/scores`      | Registra uma nova pontuação             |
| PUT    | `/api/scores/:id`  | Atualiza um registro de pontuação       |
| DELETE | `/api/scores/:id`  | Remove um registro de pontuação         |

> ⚠️ Endpoints planejados na especificação do projeto — implementação em andamento (ver [Status de implementação](#status-de-implementação)).

## Tratamento de erros

A API centraliza o tratamento de erros em um middleware global (`config/middleware/errorHandler.js`), que padroniza as respostas de erro:

```json
{
  "status": "error",
  "message": "Descrição do erro",
  "timestamp": "2026-07-18T12:00:00.000Z"
}
```

Erros de negócio (`NotFoundError`, `BusinessError`, `IlegalInputError`, `DatabaseConnectionError`, etc.) retornam o código HTTP apropriado; erros não mapeados retornam `500 Internal Server Error`.

## Coleção do Postman

Uma coleção do Postman com requisições de exemplo para cada endpoint da API deve ser disponibilizada no diretório do projeto (ex.: `postman/UnoShrek.postman_collection.json`) para facilitar os testes manuais do backend.

> ⚠️ A coleção ainda não está incluída neste repositório — pendente de criação (ver [Status de implementação](#status-de-implementação)).

## Status de implementação

| Requisito                                   | Status                  |
|----------------------------------------------|--------------------------|
| CRUD de Jogadores (`/api/players`)           | ✅ Implementado           |
| CRUD de Jogos (`/api/games`)                 | 🚧 Pendente               |
| CRUD de Cartas (`/api/cards`)                | 🚧 Pendente               |
| CRUD de Histórico de Pontuações (`/api/scores`) | 🚧 Pendente            |
| Arquitetura em três camadas                  | ✅ Implementado           |
| Uso de ORM (Mongoose)                        | ✅ Implementado           |
| Banco de dados (MongoDB)                     | ✅ Implementado           |
| Coleção Postman                              | 🚧 Pendente               |

## Autores

- Kauã
- Rodrigo
- Davi
- Pedro
