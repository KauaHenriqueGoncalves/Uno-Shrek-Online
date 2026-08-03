import { AppError } from "./base/app.error.js";

export class NotFoundError extends AppError {
  constructor(message = "Item Not Found") {
    super(message, 404);
  }
}