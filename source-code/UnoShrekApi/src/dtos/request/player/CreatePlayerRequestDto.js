import { z } from "zod";

export const CreatePlayerRequestDto = z.object({
  username: z.string().trim().min(3).max(50),
  age: z.number().int().min(1).max(120),
  email: z.email(),
});
