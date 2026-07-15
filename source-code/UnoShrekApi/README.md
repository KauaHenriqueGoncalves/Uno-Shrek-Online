# UnoShrekApi

API REST desenvolvida em Node.js, estruturada em camadas (controller, service, repository e schema), utilizando MongoDB como banco de dados.

## Estrutura do Projeto

```
(passível de mudanças)

UnoShrekApi/
├── config/           Configurações gerais da aplicação (ex: conexão com banco de dados)
├── controller/       Camada responsável por receber as requisições HTTP e retornar respostas
├── repository/       Camada responsável pelo acesso direto ao banco de dados
├── schema/           Definição dos schemas/modelos utilizados no MongoDB
├── service/          Camada de regras de negócio, entre o controller e o repository
├── .env              Variáveis de ambiente utilizadas localmente (não versionado)
├── .env.exemple      Exemplo de variáveis de ambiente necessárias para rodar o projeto
├── app.js            Configuração principal da aplicação Express
├── server.js         Ponto de entrada da aplicação (inicialização do servidor)
├── package.json      Dependências e scripts do projeto
```

## Tecnologias Utilizadas

(passível de mudanças)

- Node.js
- Express
- Mongoose
- Morgan
- Pino
- Pino-Pretty

## Pré-requisitos

- Node.js instalado (versão compatível com o uso de `--env-file`, disponível a partir do Node 20.6+)
- MongoDB instalado e em execução (local ou remoto)

## Configuração do Ambiente

O projeto utiliza um arquivo `.env` para armazenar as variáveis de ambiente. Um modelo está disponível em `.env.exemple`.
Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo, ajustando os valores conforme o seu ambiente:

```dotenv
(passível de mudanças)

API_PORT=3000
MONGODB_USER=admin
MONGODB_PASSWORD=admin123
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_NAME=UnoShrekDb
```

## Instalando as Dependências

Na raiz do projeto, execute:

```bash
npm install
```

## Configurando o MongoDB

Exemplo de execução local do MongoDB via Docker (no diretório `/source-code`):

```bash
docker compose up mongodb -d
```

## Executando o Projeto

O projeto utiliza o carregamento nativo de variáveis de ambiente do Node.js através da flag `--env-file`.

Para iniciar a aplicação, execute:

```bash
npm run start
```

A API estará disponível em `http://localhost:{API_PORT}`

## Observações

- Para a api funcione corretamente, é necessário realizar as dependencias entre classes em `api.js` como exemplo:

```javascript
dependecies() {
    this.healthController = new HealthController();
    const playerService = new PlayerService(PlayerSchema);
    this.playerController = new PlayerController(playerService);
}

controllers() {
    try {
      this.express.use("/api/health", this.healthController.routers);
      this.express.use("/api/players", this.playerController.routers);
      this.log.info("Established routes");
    } catch (error) {
      this.log.error({ err: error }, "The routers from controller isn't working correctly.");
    }
}
```
