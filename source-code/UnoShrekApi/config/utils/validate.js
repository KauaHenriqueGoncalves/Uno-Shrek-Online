import { IlegalInputError } from "./../exceptions/IlegalInputError.js";

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    throw new IlegalInputError("Validation failed", details);
  }
  return result.data;
}