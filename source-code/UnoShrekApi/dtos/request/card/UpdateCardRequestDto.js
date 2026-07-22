import { z } from "zod";
 
const COLORS = ["red", "blue", "green", "yellow", "wild"];
 
export const UpdateCardRequestDto = z.object({
  color: z.enum(COLORS).optional(),
  value: z.string().min(1).optional(),
  gameId: z.string().min(1).optional(),
});