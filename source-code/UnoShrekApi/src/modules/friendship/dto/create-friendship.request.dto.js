import { z } from "zod";
import { objectIdMongo } from "../../shared/utils/validate.js";

export const CreateFriendshipRequestDto = z.object({
  recipientId: objectIdMongo,
});
