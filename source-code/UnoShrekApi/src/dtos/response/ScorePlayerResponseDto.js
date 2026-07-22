export default class ScorePlayerResponseDto {
  constructor(score) {
    this.id = score._id.toString();
    this.playerId = score.playerId;
    this.gameId = score.gameId;
    this.score = score.score;
    this.createdAt = score.createdAt;
  }

  static fromDocument(score) {
    return new ScorePlayerResponseDto(score);
  }

  static fromDocumentList(scores) {
    return scores.map((score) => new ScorePlayerResponseDto(score));
  }
}
