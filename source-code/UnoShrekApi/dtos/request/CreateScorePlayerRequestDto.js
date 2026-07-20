import { z } from "zod";
import { objectIdMongo } from "../../config/utils/validate.js";

const baseFields = {
  playerId: objectIdMongo,
  gameId: objectIdMongo.optional(),
  score: z.number().int().positive(),
};

export const CreateScorePlayerRequestDto = z.object(baseFields);