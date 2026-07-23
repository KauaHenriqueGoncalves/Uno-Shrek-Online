import { z } from "zod";
import { objectIdMongo } from "../../../config/utils/validate.js";
<<<<<<< Updated upstream:source-code/UnoShrekApi/src/dtos/request/card/CreateCardRequestDto.js

=======
 
>>>>>>> Stashed changes:source-code/UnoShrekApi/dtos/request/card/CreateCardRequestDto.js
const COLORS = ["red", "blue", "green", "yellow", "wild"];

export const CreateCardRequestDto = z.object({
<<<<<<< Updated upstream:source-code/UnoShrekApi/src/dtos/request/card/CreateCardRequestDto.js
  color: z.enum(COLORS, {
    message: "color must be: red, blue, green, yellow or wild",
  }),
=======
  // Only allow the colors supported by the game engine.
  color: z.enum(COLORS, { message: "color must be: red, blue, green, yellow or wild" }),
  // Card values must be present and non-empty.
>>>>>>> Stashed changes:source-code/UnoShrekApi/dtos/request/card/CreateCardRequestDto.js
  value: z.string().min(1, { message: "value is required" }),
  // Each card must belong to an existing game.
  gameId: objectIdMongo,
});
