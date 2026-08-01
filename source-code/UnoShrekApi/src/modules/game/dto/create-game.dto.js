import { z } from "zod";

export const CreateGameRequestDto = z.object({
  title: z.string().trim().min(3).max(60),
  maxPlayers: z.number().int().min(1).max(4),
});
