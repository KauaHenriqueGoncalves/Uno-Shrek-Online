import { AppError } from "./base/app.error.js";

export class ApiError extends AppError {
  constructor(message = "Api is not working correctly.") {
    super(message, 404);
  }
}