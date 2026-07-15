export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message); 
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // marca como erro "esperado" na classe ERROR meus amigos e companheiros
    Error.captureStackTrace(this, this.constructor);
  }
}