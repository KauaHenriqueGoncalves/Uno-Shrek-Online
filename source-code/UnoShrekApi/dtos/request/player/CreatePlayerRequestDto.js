import { z } from "zod";

const baseFields = {
  username: z.string().trim().min(3).max(50),
  age: z.number().int().min(1).max(120),
  email: z.email(),
};

export const CreatePlayerRequestDto = z.object(baseFields);