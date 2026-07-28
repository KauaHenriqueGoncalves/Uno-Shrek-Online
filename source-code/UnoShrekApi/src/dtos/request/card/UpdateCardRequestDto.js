import { z } from "zod";
import { objectIdMongo } from "../../../config/utils/validate.js";

const COLORS = ["red", "blue", "green", "yellow", "wild"];

export const UpdateCardRequestDto = z.object({
  color: z.enum(COLORS).optional(),
  value: z.string().min(1).optional(),
  gameId: objectIdMongo.optional(),
});
