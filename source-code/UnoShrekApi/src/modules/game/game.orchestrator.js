import mongoose from "mongoose";
import GameRepository from "./game.repository.js";
import GameEngine from "./game.engine.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { BusinessError } from "../shared/errors/business.error.js";
import { NotFoundError } from "../shared/errors/not-found.error.js";
import { GAME_STATUS } from "./game.schema.js";

export default class GameOrchestrator {
  constructor(schema) {
    this.gameRepository = new GameRepository(schema);
    this.log = PinoGlobal.getInstance();
  }

  async _runTransactionOrFallback(operationFn) {
    let session = null;
    try {
      session = await mongoose.startSession();
      let result = null;
      await session.withTransaction(async () => {
        result = await operationFn(session);
      });
      return result;
    } catch (err) {
      // If server does not support transactions (standalone), fall back to no-session execution
      if (err && (err.code === 20 || (err.message && err.message.includes("Transaction numbers are only allowed")))) {
        this.log.warn({ err: err.message }, "Transactions not supported; running operation without transaction/session");
        try {
          return await operationFn(null);
        } catch (innerErr) {
          throw innerErr;
        }
      }
      throw err;
    } finally {
      if (session) session.endSession();
    }
  }

  _toEngineState(game) {
    const players = game.players.map((p) => ({ player: p.player, hand: { cards: (p.hand && p.hand.cards) ? [...p.hand.cards] : [] } }));
    return {
      deck: game.deck ? [...game.deck] : [],
      discard: game.discard ? [...game.discard] : [],
      players,
      currentPlayer: game.currentPlayer,
      direction: game.direction ?? 1,
      activeColor: game.activeColor ?? null,
    };
  }

  _applyEngineStateToGame(game, state) {
    game.deck = state.deck;
    game.discard = state.discard;
    game.currentPlayer = state.currentPlayer;
    game.direction = state.direction;
    game.activeColor = state.activeColor;
    game.players = game.players.map((p) => {
      const ep = state.players.find((sp) => sp.player.toString() === p.player.toString());
      return { ...p, hand: ep ? { cards: ep.hand.cards } : { cards: [] } };
    });
    return game;
  }

  async draw(userId, gameId) {
    return await this._runTransactionOrFallback(async (session) => {
      const game = await this.gameRepository.getById(gameId, session);
      if (!game) throw new NotFoundError("Game not found");
      if (game.status !== GAME_STATUS.ACTIVE) throw new BusinessError("Cannot draw from a non-active game");
      const playerIndex = game.players.findIndex((p) => p.player.toString() === userId.toString());
      if (playerIndex === -1) throw new BusinessError("Player is not present this game");
      if (game.currentPlayer && game.currentPlayer.toString() !== userId.toString()) throw new BusinessError("It's not your turn");

      const state = this._toEngineState(game);
      const { state: newState } = GameEngine.drawFromDeck(state, playerIndex, 1);

      const nextIndex = (playerIndex + 1) % newState.players.length;
      newState.currentPlayer = newState.players[nextIndex].player;

      this._applyEngineStateToGame(game, newState);
      const resultGame = await this.gameRepository.update(gameId, game, session);
      return resultGame;
    });
  }

  async play(userId, gameId, playedCard, colorChoice = null) {
    return await this._runTransactionOrFallback(async (session) => {
      const game = await this.gameRepository.getById(gameId, session);
      if (!game) throw new NotFoundError("Game not found");
      if (game.status !== GAME_STATUS.ACTIVE) throw new BusinessError("Cannot play in a non-active game");
      const playerIndex = game.players.findIndex((p) => p.player.toString() === userId.toString());
      if (playerIndex === -1) throw new BusinessError("Player is not present this game");
      if (game.currentPlayer && game.currentPlayer.toString() !== userId.toString()) throw new BusinessError("It's not your turn");

      const state = this._toEngineState(game);
      const top = state.discard && state.discard.length > 0 ? state.discard[state.discard.length - 1] : null;
      if (!GameEngine.validatePlay(playedCard, top, state.activeColor)) {
        throw new BusinessError("Invalid play");
      }

      const { state: newState } = GameEngine.applyPlay(state, playerIndex, playedCard, colorChoice);
      this._applyEngineStateToGame(game, newState);
      const resultGame = await this.gameRepository.update(gameId, game, session);
      return resultGame;
    });
  }

  async start(userId, gameId) {
    return await this._runTransactionOrFallback(async (session) => {
      const game = await this.gameRepository.getById(gameId, session);
      if (!game) throw new NotFoundError("Game not found");
      if (game.owner.toString() !== userId.toString()) throw new BusinessError("Player is not owner to start game.");
      if (game.status !== GAME_STATUS.PENDING) throw new BusinessError("Game already started or finished.");
      if (game.players.length < 2) throw new BusinessError("Not enough players to start the game.");
      if (!game.players.every((player) => player.ready === true)) throw new BusinessError("All players must be ready.");

      const playerIds = game.players.map((p) => p.player);
      const engineState = GameEngine.startGameState(playerIds, 7);
      game.players = game.players.map((p) => {
        const found = engineState.players.find((ep) => ep.player.toString() === p.player.toString());
        return { ...p, hand: found ? found.hand : { cards: [] } };
      });
      game.deck = engineState.deck;
      game.discard = engineState.discard;
      game.currentPlayer = engineState.currentPlayer;
      game.direction = engineState.direction;
      game.activeColor = engineState.activeColor;
      game.status = GAME_STATUS.ACTIVE;

      const resultGame = await this.gameRepository.update(gameId, game, session);
      return resultGame;
    });
  }
}
