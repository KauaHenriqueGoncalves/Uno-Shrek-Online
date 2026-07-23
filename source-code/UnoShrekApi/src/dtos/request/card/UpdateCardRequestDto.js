import { z } from "zod";
import { objectIdMongo } from "../../../config/utils/validate.js";

const COLORS = ["red", "blue", "green", "yellow", "wild"];

export const UpdateCardRequestDto = z.object({
  // Updates can change only the supported card colors.
  color: z.enum(COLORS).optional(),
  // Value is optional on partial updates, but still must be valid when provided.
  value: z.string().min(1).optional(),
  // The game reference can be moved to another game if needed.
  gameId: objectIdMongo.optional(),
});
