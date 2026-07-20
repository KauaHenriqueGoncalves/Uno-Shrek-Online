import { z } from "zod";
import { objectIdMongo } from "../../config/utils/validate";

const baseFields = {
  playerId: objectIdMongo,
  gameId: objectIdMongo.optional(),
  score: z.number().int().positive(),
};

const notEmpty = (data) => Object.keys(data).length > 0;

export const UpdateScorePlayerRequestDto = z
  .object(baseFields)
  .partial()
  .refine(notEmpty, { message: "At least one field must be provided" });
