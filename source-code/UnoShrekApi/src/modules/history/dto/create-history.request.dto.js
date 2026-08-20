import { z } from "zod";
import { objectIdMongo } from "../../shared/utils/validate.js";

export const CreateHistoryRequestDto = z.object({
  player: objectIdMongo,
  action: z.string().min(1, "Action is required"),
  card: objectIdMongo.optional(),
});
