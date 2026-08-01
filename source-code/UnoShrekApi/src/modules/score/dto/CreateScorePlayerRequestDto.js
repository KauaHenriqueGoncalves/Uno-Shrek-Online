import { z } from "zod";
import { objectIdMongo } from "../../../config/utils/validate.js";

export const CreateScorePlayerRequestDto = z.object({
  playerId: objectIdMongo,
  gameId: objectIdMongo,
  score: z.number().int().positive(),
});