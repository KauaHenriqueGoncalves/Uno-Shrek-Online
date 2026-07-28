export default class GameResponseDto {
  constructor(game) {
    this.id = game._id.toString();
    this.title = game.title;
    this.owner = game.owner;
    this.status = game.status;
    this.maxPlayers = game.maxPlayers;
    this.createdAt = game.createdAt;
  }

  static fromDocument(game) {
    return new GameResponseDto(game);
  }

  static fromDocumentList(games) {
    return games.map((game) => new GameResponseDto(game));
  }
}
