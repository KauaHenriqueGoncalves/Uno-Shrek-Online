import mongoose from "mongoose";

export default class TransactionRunner {
  /**
   *  OBS: NO MOMENTO, O MOTODO _runTransactionOrFallback NÃO ESTÁ SENDO SUPORTADO PELO MONGOOSE.
   *  NÃO IMPACTA O FUNCIONAMENTO DO SISTEMA, MAS É MOSTRADO NO LOG DE ERROS.
   */
  async run(operationFn) {
    let session = null;
    try {
      session = await mongoose.startSession();
      let result = null;
      await session.withTransaction(async () => {
        result = await operationFn(session);
      });
      return result;
    } catch (err) {
      if (this._isTransactionUnsupported(err)) {
        return await operationFn(null);
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  _isTransactionUnsupported(err) {
    return (
      err &&
      (err.code === 20 ||
        err.message?.includes("Transaction numbers are only allowed"))
    );
  }
}
