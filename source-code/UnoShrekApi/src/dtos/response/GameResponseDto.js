import PlayerResponseDto from "./PlayerResponseDto.js";

export default class GameResponseDto {
  constructor(game) {
    this.id = game._id.toString();
    this.title = game.title;
    this.owner = game.owner;
    this.status = game.status;
    this.maxPlayers = game.maxPlayers;
    this.players = game.players;
    this.createdAt = game.createdAt;
  }

  static fromDocument(game) {
    return new GameResponseDto(game);
  }

  static fromDocumentViewSimple(game) {
    return {
      id: game._id.toString(),
      title: game.title,
      owner: game.owner,
      status: game.status,
      totalPlayers: `${game.players.length}/${game.maxPlayers}`,
    };
  }

  static fromDocumentStatus(game) {
    return {
      id: game._id.toString(),
      title: game.title,
      status: game.status,
    };
  }

  static fromDocumentRoom(game, players) {
    return {
      id: game._id.toString(),
      title: game.title,
      owner: game.owner,
      status: game.status,
      maxPlayers: game.maxPlayers,
      players: game.players.map((gamePlayer) => {
        const playerId = gamePlayer.player.toString();
        const player = players.find((p) => p._id.toString() === playerId);
        return PlayerResponseDto.fromDocumentRoom(
          player,
          gamePlayer.ready,
          gamePlayer.score,
        );
      }),
      createdAt: game.createdAt,
    };
  }

  static fromDocumentCurrentScore(game, scores) {
    return {
      id: game._id.toString(),
      scores: scores,
    };
  }

  static fromDocumentCurrentPlayer(game, players) {
    return {
      id: game._id,
      players: players.map((p) => PlayerResponseDto.fromDocumentViewSimple(p)),
    };
  }

  static fromDocumentList(games) {
    return games.map((game) => this.fromDocumentViewSimple(game));
  }
}
