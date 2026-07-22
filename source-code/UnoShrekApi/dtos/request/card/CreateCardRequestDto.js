import { z } from "zod";
 
const COLORS = ["red", "blue", "green", "yellow", "wild"];
 
export const CreateCardRequestDto = z.object({
  color: z.enum(COLORS, { message: "color must be: red, blue, green, yellow or wild" }),
  value: z.string().min(1, { message: "value is required" }),
  gameId: z.string().min(1, { message: "gameId is required" }),
});