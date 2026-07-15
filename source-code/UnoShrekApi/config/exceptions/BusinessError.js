import { AppError } from "./AppError.js";

export class BusinessError extends AppError {
  constructor(message = "Business Exeception") {
    super(message, 400);
  }
}