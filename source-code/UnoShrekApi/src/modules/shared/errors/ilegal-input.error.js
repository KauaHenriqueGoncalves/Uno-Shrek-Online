import { AppError } from "./base/app.error.js";

export class IlegalInputError extends AppError {
  constructor(message = "Input is not valid.") {
    super(message, 404);
  }
}