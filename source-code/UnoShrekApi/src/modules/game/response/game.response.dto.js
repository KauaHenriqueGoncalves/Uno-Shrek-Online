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
        hand: {
          cards: p.hand.cards.map((c) => this.fromDocumentDeckOnHand(c)),
        },
      })),
      deck: game.deck.map((c) => this.fromDocumentDeckOnHand(c)),
      discard: game.discard.map((c) => this.fromDocumentDeckOnHand(c)),
      direction: game.direction,
      activeColor: game.activeColor,
      createdAt: game.createdAt,
    };
  }

  static fromDocumentCurrentScore(game) {
    return {
      id: game._id.toString(),
      scores: game.players.map((p) => ({
        playerId: p.player._id.toString(),
        username: p.player.username,
        score: p.scorePlayer ? p.scorePlayer.score : 0,
      })),
    };
  }

  static fromDocumentCurrentPlayers(game) {
    return {
      id: game._id.toString(),
      players: game.players.map((p) => {
        return {
          id: p.player._id.toString(),
          username: p.player.username,
        };
      }),
    };
  }

  static fromDocumentCurrentPlayer(game) {
    return {
      id: game._id.toString(),
      currentPlayer: game.currentPlayer
        ? game.currentPlayer._id.toString()
        : null,
    };
  }

  static fromDocumentTopCard(game) {
    return {
      id: game._id.toString(),
      topCard:
        game.discard.length > 0 ? game.discard[game.discard.length - 1] : null,
    };
  }

  static fromDocumentDeckOnHand(card) {
    return {
      id: card._id.toString(),
      type: card.type,
      color: card.color,
      value: card.value,
    };
  }

  static fromDocumentList(games) {
    return games.map((game) => this.fromDocumentViewSimple(game));
  }
}
