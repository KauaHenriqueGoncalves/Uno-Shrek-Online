import { z } from "zod";
import { objectIdMongo } from "../../shared/utils/validate.js";

export const CreateScorePlayerRequestDto = z.object({
  playerId: objectIdMongo,
  gameId: objectIdMongo,
  score: z.number().int().positive().min(0, "Score must be greater than or equal to 0"),
});