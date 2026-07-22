import { z } from "zod";

const baseFields = {
  title: z.string().trim().min(3).max(60),
  maxPlayers: z.number().int().min(1).max(4),
};

export const CreateGameRequestDto = z.object(baseFields);