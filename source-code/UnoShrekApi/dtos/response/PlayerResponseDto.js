export default class PlayerResponseDto {
  constructor(player) {
    this.id = player._id.toString();
    this.username = player.username;
    this.age = player.age;
    this.email = player.email;
    this.createdAt = player.createdAt;
  }

  static fromDocument(player) {
    return new PlayerResponseDto(player);
  }

  static fromDocumentList(players) {
    return players.map((player) => new PlayerResponseDto(player));
  }
}
