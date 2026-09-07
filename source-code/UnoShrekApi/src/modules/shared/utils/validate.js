/**
 * Funções utilitárias para validação e tratamento de dados de entrada.
 *
 * `parseOrThrow` recebe um schema do Zod e os dados que precisam ser
 * validados. Se os dados forem inválidos, registra os detalhes no log
 * e lança um erro de entrada inválida. Se forem válidos, retorna os
 * dados já processados pelo Zod.
 *
 * `objectIdMongo` é um schema reutilizável que valida se um valor é uma
 * string e possui um formato de ObjectId válido para o MongoDB.
 *
 * Essas funções são utilizadas pelos DTOs e Services para garantir que
 * dados inválidos não avancem para as regras de negócio ou para o banco.
 */

import { z } from "zod";
import { IlegalInputError } from "../errors/ilegal-input.error.js";
import mongoose from "mongoose";
import PinoGlobal from "../logger/pino-global.logger.js";

const log = PinoGlobal.getInstance();

/**
 * Valida os dados usando um schema Zod.
 * Em caso de erro, registra os campos inválidos e lança um IlegalInputError.
 * Se a validação passar, retorna os dados validados pelo Zod.
 */
export function parseOrThrow(zod, data) {
  const result = zod.safeParse(data);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    log.warn({ fields: details }, "the data is not valid");
    throw new IlegalInputError("Validation failed");
  }
  return result.data;
}

/**
 * Schema Zod para validar IDs do MongoDB.
 * Verifica se o valor é uma string e se pode ser convertido em um ObjectId válido.
 */
export const objectIdMongo = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid id format",
  });
