import { z } from "zod";
import { objectIdMongo } from "../../../config/utils/validate.js";

const COLORS = ["red", "blue", "green", "yellow", "wild"];

export const UpdateCardRequestDto = z.object({
  color: z.enum(COLORS),
  value: z.string().min(1),
  gameId: objectIdMongo,
});
