import { z } from "zod";

const PlayerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  email: z.email(),
  createdAt: z.date(),
});

export function toPlayerResponse(player) {
  return PlayerResponseSchema.parse({
    id: player._id.toString(),
    name: player.name,
    age: player.age,
    email: player.email,
    createdAt: player.createdAt,
  });
}
