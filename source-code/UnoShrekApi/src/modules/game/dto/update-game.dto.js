import { z } from "zod";
import { GAME_STATUS } from "../Game.js";

const notEmpty = (data) => Object.keys(data).length > 0;

export const UpdateGameRequestDto = z
  .object({
    title: z.string().trim().min(3).max(60),
    maxPlayers: z.number().int().min(1).max(4),
    status: z.enum(Object.values(GAME_STATUS)),
  })
  .partial()
  .refine(notEmpty, { message: "At least one field must be provided" });
