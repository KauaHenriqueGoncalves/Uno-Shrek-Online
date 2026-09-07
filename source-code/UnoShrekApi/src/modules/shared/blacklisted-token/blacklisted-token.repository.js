import CrudRepository from "../repository/crud.repository.js";

/**
 * Repositório especializado no gerenciamento de tokens bloqueados.
 *
 * Sua principal função é consultar a blacklist para verificar se um
 * determinado token já foi invalidado pelo sistema.
 */
export default class BlacklistedTokenRepository extends CrudRepository {
  constructor(schema) {
    super(schema);
  }

  /**
   * Verifica se um token existe na blacklist.
   *
   * Problema resolvido:
   * JWTs normalmente continuam válidos até sua data de expiração.
   * Portanto, mesmo que um usuário faça logout, o token ainda poderia
   * ser utilizado até expirar. Esta função permite verificar se ele
   * foi invalidado antes desse prazo.
   *
   * @param {string} token - Token que será procurado na blacklist.
   * @param {object|null} session - Sessão opcional do MongoDB.
   * @returns {Promise<boolean>} true se o token estiver bloqueado,
   * false caso contrário.
   */
  async existsByToken(token, session = null) {

    /**
     * Procura no banco um documento com o mesmo token.
     * Se uma sessão MongoDB for fornecida, a consulta é executada
     * dentro dessa sessão.
     */
    const doc = await this.schema.findOne({ token }).session(session);

    /**
     * Converte o resultado em um valor booleano:
     * 
     * Documento encontrado -> true
     * null/undefined        -> false
     */
    return !!doc;
  }
}
