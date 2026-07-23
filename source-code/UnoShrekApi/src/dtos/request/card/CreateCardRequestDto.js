import { z } from "zod";
import { objectIdMongo } from "../../../config/utils/validate.js";

const COLORS = ["red", "blue", "green", "yellow", "wild"];

export const CreateCardRequestDto = z.object({
  // Only allow the colors supported by the game engine.
  color: z.enum(COLORS, { message: "color must be: red, blue, green, yellow or wild" }),
  // Card values must be present and non-empty.
  value: z.string().min(1, { message: "value is required" }),
  // Each card must belong to an existing game.
  gameId: objectIdMongo,
});
