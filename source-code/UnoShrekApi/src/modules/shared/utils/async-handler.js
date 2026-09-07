/**
 * Wrapper para funções assíncronas do Express.
 *
 * Recebe um handler (controller) e retorna uma nova função que executa
 * esse handler e captura automaticamente qualquer erro ocorrido em sua
 * Promise. Caso aconteça um erro, o `catch(next)` envia o erro para o
 * middleware global de tratamento de erros do Express.
 *
 * Dessa maneira, os controllers não precisam repetir `try/catch` em todas
 * as funções assíncronas.
 */
export default function asyncHandler(fn) {
  return function asyncUtilWrap(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
