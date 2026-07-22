import { z } from "zod";
import { objectIdMongo } from "../../config/utils/validate.js";
 
const COLORS = ["red", "blue", "green", "yellow", "wild"];
 
export const CreateCardRequestDto = z.object({
  color: z.enum(COLORS, { message: "color must be: red, blue, green, yellow or wild" }),
  value: z.string().min(1, { message: "value is required" }),
  gameId: objectIdMongo,
});