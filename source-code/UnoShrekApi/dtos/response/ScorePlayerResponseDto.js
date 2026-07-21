export function toScorePlayerResponse(scorePlayer) {
  return {
    id: scorePlayer._id.toString(),
    playerId: scorePlayer.playerId,
    gameId: scorePlayer.gameId,
    score: scorePlayer.score,
    createdAt: scorePlayer.createdAt,
  };
}
