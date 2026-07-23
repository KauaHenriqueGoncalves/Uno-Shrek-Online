import { z } from "zod";
import { objectIdMongo } from "../../../config/utils/validate.js";

const notEmpty = (data) => Object.keys(data).length > 0;

export const UpdateScorePlayerRequestDto = z
  .object({
    playerId: objectIdMongo,
    gameId: objectIdMongo,
    score: z.number().int().positive(),
  })
  .partial()
  .refine(notEmpty, { message: "At least one field must be provided" });
