import { z } from "zod";
import { objectIdMongo } from "../../shared/utils/validate.js";

export const PlayCardRequestDto = z.object({
  cardId: objectIdMongo,
  colorChoice: z.enum(["red", "green", "blue", "yellow"]).nullable().optional(),
});
