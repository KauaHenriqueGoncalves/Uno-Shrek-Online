import { IlegalInputError } from "./../exceptions/IlegalInputError.js";
import mongoose from "mongoose";

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    throw new IlegalInputError("Validation failed", details);
  }
  return result.data;
}

export const objectIdMongo = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid id format",
  });
