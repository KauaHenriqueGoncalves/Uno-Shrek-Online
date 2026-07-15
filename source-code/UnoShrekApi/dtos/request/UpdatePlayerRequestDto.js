import { z } from "zod";

const baseFields = {
  name: z.string().trim().min(3).max(50),
  age: z.number().int().min(1).max(120),
  email: z.email(),
};

const notEmpty = (data) => Object.keys(data).length > 0;

export const UpdatePlayerRequestDto = z
  .object(baseFields)
  .partial()
  .refine(notEmpty, { message: "At least one field must be provided" });
