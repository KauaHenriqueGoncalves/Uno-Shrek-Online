import { z } from "zod";
import { objectIdMongo } from "../../shared/utils/validate.js";

const notEmpty = (data) => Object.keys(data).length > 0;

export const UpdateScorePlayerRequestDto = z
  .object({
    playerId: objectIdMongo,
    gameId: objectIdMongo,
    score: z.number().int().positive().min(0, "Score must be greater than or equal to 0"),
  })
  .partial()
  .refine(notEmpty, { message: "At least one field must be provided" });
