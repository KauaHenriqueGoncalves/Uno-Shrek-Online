export function toPlayerResponse(player) {
  return {
    id: player._id.toString(),
    username: player.username,
    age: player.age,
    email: player.email,
    createdAt: player.createdAt,
  };
}
