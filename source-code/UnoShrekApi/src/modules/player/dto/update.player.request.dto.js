import { z } from "zod";

const notEmpty = (data) => Object.keys(data).length > 0;

export const UpdatePlayerRequestDto = z
  .object({
    username: z.string().trim().min(3).max(50),
    age: z.number().int().min(1).max(120),
    email: z.email(),
  })
  .partial()
  .refine(notEmpty, { message: "At least one field must be provided" });
