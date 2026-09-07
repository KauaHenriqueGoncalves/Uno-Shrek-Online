import { z } from "zod";

export const CreateGameRequestDto = z.object({
  title: z.string().trim().min(3).max(60),
  password: z.string().trim().max(20).optional().default(""),
  maxPlayers: z.number().int().min(1).max(4),
});
