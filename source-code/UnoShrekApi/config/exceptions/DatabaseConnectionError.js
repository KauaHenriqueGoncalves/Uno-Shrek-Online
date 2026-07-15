import { AppError } from "./AppError.js";

export class DatabaseConnectionError extends AppError {
  constructor(message = "Faield connection to database") {
    super(message, 503);
  }
}