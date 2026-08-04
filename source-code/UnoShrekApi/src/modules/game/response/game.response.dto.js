import PlayerResponseDto from "../../player/response/player.response.dto.js";

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

  static fromDocumentRoom(game) {
    return {
      id: game._id.toString(),
      title: game.title,
      owner: game.owner ? game.owner._id.toString() : null,
      status: game.status,
      currentPlayer: game.currentPlayer
        ? game.currentPlayer._id.toString()
        : null,
      maxPlayers: game.maxPlayers,
      players: game.players.map((p) => ({
        player: p.player._id.toString(),
        username: p.player.username,
        ready: p.ready,
        score: p.scorePlayer ? p.scorePlayer.score : 0,
        hand: { cards: p.hand.cards },
      })),
      deck: game.deck,
      discard: game.discard,
      createdAt: game.createdAt,
    };
  }

  static fromDocumentCurrentScore(gameId, scores) {
    return {
      id: gameId,
      scores: scores.map((s) => ({
        playerId: s.player.toString(),
        username: s.username,
        score: s.score,
      })),
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
