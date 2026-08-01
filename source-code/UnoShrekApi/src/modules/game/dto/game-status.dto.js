import { z } from "zod";
import { GAME_STATUS } from "../Game.js";

export const GameStatusDto = z.object({
  status: z.enum(Object.values(GAME_STATUS)),
});