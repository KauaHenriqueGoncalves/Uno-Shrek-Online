import { AppError } from "./base/app.error.js";

export class BusinessError extends AppError {
  constructor(message = "Business Exeception") {
    super(message, 400);
  }
}