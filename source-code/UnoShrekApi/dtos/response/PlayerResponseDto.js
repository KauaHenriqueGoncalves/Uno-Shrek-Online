export function toPlayerResponse(player) {
  return {
    id: player._id.toString(),
    name: player.name,
    age: player.age,
    email: player.email,
    createdAt: player.createdAt,
  };
}
