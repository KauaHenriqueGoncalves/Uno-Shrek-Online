import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(message = "Item Not Found") {
    super(message, 404);
  }
}