import { z } from "zod";
import { objectIdMongo } from "../../shared/utils/validate.js";

export const CreateScorePlayerRequestDto = z.object({
  playerId: objectIdMongo,
  gameId: objectIdMongo,
  score: z.number().int().positive(),
});