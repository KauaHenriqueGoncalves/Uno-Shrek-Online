import { z } from "zod";
import { GAME_STATUS } from "../../schema/Game.js";

const GameResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(Object.values(GAME_STATUS)),
  maxPlayers: z.number(),
  createdAt: z.date(),
});

export function toGameResponse(game) {
  return GameResponseSchema.parse({
    id: game._id.toString(),
    title: game.title,
    status: game.status,
    maxPlayers: game.maxPlayers,
    createdAt: game.createdAt,
  });
}
