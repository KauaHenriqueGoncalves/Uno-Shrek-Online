import { z } from "zod";
import { IlegalInputError } from "./../exceptions/IlegalInputError.js";
import mongoose from "mongoose";
import PinoGlobal from "./../logger/PinoGlobal.js";

const log = PinoGlobal.getInstance();

export function parseOrThrow(zod, data) {
  const result = zod.safeParse(data);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    log.warn({ fields: details }, "the data is not valid");
    throw new IlegalInputError("Validation failed");
  }
  return result.data;
}

export const objectIdMongo = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid id format",
  });
