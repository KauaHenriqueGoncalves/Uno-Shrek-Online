# Source Code

Project source code, divided into backend, frontend, and orchestration via Docker Compose.

## Structure

- **`UnoShrekApi/`**: REST API + Socket.io (Node.js, Express, MongoDB)
- **`UnoShrekFrontEnd/`**: Game client application
- **`docker-compose.yml`**: Orchestrates the services required to run the project locally

## Configuration

Each application (`UnoShrekApi/` and `UnoShrekFrontEnd/`) has its own `.env.example` file. Before running either of them, you must navigate to the respective directory and create a `.env` file based on the `.env.example` template.

```bash
cd UnoShrekApi
cp .env.example .env
# fill in the required variables

cd ../UnoShrekFrontEnd
cp .env.example .env
# fill in the required variables
```

## How to Run

```bash
docker compose up -d
```

This starts the necessary services (e.g., MongoDB) defined in `docker-compose.yml`.

Then, follow the specific instructions within each directory (`UnoShrekApi/` and `UnoShrekFrontEnd/`) to install dependencies and start each application.