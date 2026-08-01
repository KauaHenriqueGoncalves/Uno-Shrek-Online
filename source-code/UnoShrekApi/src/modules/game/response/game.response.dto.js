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

  static fromDocumentRoom(game, players) {
    return {
      id: game._id.toString(),
      title: game.title,
      owner: game.owner,
      status: game.status,
      currentPlayer: game.currentPlayer ? game.currentPlayer.toString() : null,
      maxPlayers: game.maxPlayers,
      players: game.players.map((p) => {
        const playerInfo = players.find(
          (pl) => pl._id.toString() === p.player.toString(),
        );
        return {
          player: p.player.toString(),
          username: playerInfo ? playerInfo.username : null,
          ready: p.ready,
          score: p.score,
          hand: {
            cards: p.hand.cards,
          },
        };
      }),
      deck: game.deck,
      discard: game.discard,
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
