import PlayerResponseDto from "../../player/response/player.response.dto.js";
import GameResponseDto from "../../game/response/game.response.dto.js";

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

  static fromDetails(score, player, game) {
    return {
      id: score._id.toString(),
      score: score.score,
      createdAt: score.createdAt,
      player: PlayerResponseDto.fromDocument(player),
      game: GameResponseDto.fromDocument(game),
    };
  }

  static fromDocumentList(scores) {
    return scores.map((score) => new ScorePlayerResponseDto(score));
  }
}
